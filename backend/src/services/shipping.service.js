import mysql from 'mysql2/promise';
import config from '../config/config.js';

const pool = mysql.createPool(config.database);

class ShippingService {
    async calculateShipping(items, address) {
        const connection = await pool.getConnection();
        try {
            // Get product details for weight calculation
            let totalWeight = 0;
            for (const item of items) {
                const [products] = await connection.query(
                    'SELECT weight FROM products WHERE id = ?',
                    [item.productId]
                );

                if (!products.length) {
                    throw new Error(`Product ${item.productId} not found`);
                }

                totalWeight += products[0].weight * item.quantity;
            }

            // Find applicable shipping zone
            const [zones] = await connection.query(
                `SELECT z.*, 
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', m.id,
                            'name', m.name,
                            'base_rate', m.base_rate,
                            'rate_per_kg', m.rate_per_kg
                        )
                    ) as methods
                 FROM shipping_zones z
                 JOIN shipping_zone_methods zm ON z.id = zm.zone_id
                 JOIN shipping_methods m ON zm.method_id = m.id
                 WHERE JSON_CONTAINS(z.regions, ?)
                 GROUP BY z.id`,
                [JSON.stringify(address.region)]
            );

            if (!zones.length) {
                throw new Error('No shipping options available for this location');
            }

            const zone = zones[0];
            const methods = JSON.parse(zone.methods);

            // Calculate shipping cost for each method
            const shippingOptions = methods.map(method => {
                const weightCharge = totalWeight * method.rate_per_kg;
                const totalCost = method.base_rate + weightCharge;

                return {
                    methodId: method.id,
                    name: method.name,
                    cost: totalCost,
                    estimatedDays: zone.estimated_days
                };
            });

            return shippingOptions;
        } finally {
            connection.release();
        }
    }

    async getShippingMethods() {
        const connection = await pool.getConnection();
        try {
            const [methods] = await connection.query(
                'SELECT * FROM shipping_providers'
            );
            return methods;
        } finally {
            connection.release();
        }
    }

    async updateShippingMethod(methodId, updateData) {
        const connection = await pool.getConnection();
        try {
            const allowedUpdates = ['name', 'description', 'base_rate', 'rate_per_kg', 'is_active'];
            const updates = {};

            for (const [key, value] of Object.entries(updateData)) {
                const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
                if (allowedUpdates.includes(snakeKey)) {
                    updates[snakeKey] = value;
                }
            }

            if (Object.keys(updates).length === 0) {
                throw new Error('No valid update fields provided');
            }

            const [result] = await connection.query(
                'UPDATE shipping_methods SET ? WHERE id = ?',
                [updates, methodId]
            );

            if (result.affectedRows === 0) {
                throw new Error('Shipping method not found');
            }
        } finally {
            connection.release();
        }
    }

    async addShippingMethod(name, description, baseRate, ratePerKg) {
        const connection = await pool.getConnection();
        try {
            const [result] = await connection.query(
                `INSERT INTO shipping_methods (
                    name,
                    description,
                    base_rate,
                    rate_per_kg,
                    is_active,
                    created_at
                ) VALUES (?, ?, ?, ?, true, NOW())`,
                [name, description, baseRate, ratePerKg]
            );

            const [methods] = await connection.query(
                'SELECT * FROM shipping_methods WHERE id = ?',
                [result.insertId]
            );

            return methods[0];
        } finally {
            connection.release();
        }
    }

    async deleteShippingMethod(methodId) {
        const connection = await pool.getConnection();
        try {
            // Check if method is in use
            const [usages] = await connection.query(
                'SELECT COUNT(*) as count FROM shipping_zone_methods WHERE method_id = ?',
                [methodId]
            );

            if (usages[0].count > 0) {
                throw new Error('Cannot delete shipping method that is in use by shipping zones');
            }

            const [result] = await connection.query(
                'DELETE FROM shipping_methods WHERE id = ?',
                [methodId]
            );

            if (result.affectedRows === 0) {
                throw new Error('Shipping method not found');
            }
        } finally {
            connection.release();
        }
    }

    async addShippingZone(name, regions, methodIds, rates) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Create zone
            const [result] = await connection.query(
                `INSERT INTO shipping_zones (
                    name,
                    regions,
                    created_at
                ) VALUES (?, ?, NOW())`,
                [name, JSON.stringify(regions)]
            );

            const zoneId = result.insertId;

            // Add methods to zone
            const zoneMethodValues = methodIds.map((methodId, index) => [
                zoneId,
                methodId,
                rates[index] || null
            ]);

            await connection.query(
                'INSERT INTO shipping_zone_methods (zone_id, method_id, custom_rate) VALUES ?',
                [zoneMethodValues]
            );

            await connection.commit();

            // Get complete zone details
            const [zones] = await connection.query(
                `SELECT z.*, 
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', m.id,
                            'name', m.name,
                            'custom_rate', zm.custom_rate
                        )
                    ) as methods
                 FROM shipping_zones z
                 JOIN shipping_zone_methods zm ON z.id = zm.zone_id
                 JOIN shipping_methods m ON zm.method_id = m.id
                 WHERE z.id = ?
                 GROUP BY z.id`,
                [zoneId]
            );

            return zones[0];
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async updateShippingZone(zoneId, updateData) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Update zone details
            if (updateData.name || updateData.regions) {
                const updates = {};
                if (updateData.name) updates.name = updateData.name;
                if (updateData.regions) updates.regions = JSON.stringify(updateData.regions);

                await connection.query(
                    'UPDATE shipping_zones SET ? WHERE id = ?',
                    [updates, zoneId]
                );
            }

            // Update zone methods if provided
            if (updateData.methodIds) {
                // Remove existing methods
                await connection.query(
                    'DELETE FROM shipping_zone_methods WHERE zone_id = ?',
                    [zoneId]
                );

                // Add new methods
                const zoneMethodValues = updateData.methodIds.map((methodId, index) => [
                    zoneId,
                    methodId,
                    updateData.rates?.[index] || null
                ]);

                await connection.query(
                    'INSERT INTO shipping_zone_methods (zone_id, method_id, custom_rate) VALUES ?',
                    [zoneMethodValues]
                );
            }

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async deleteShippingZone(zoneId) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Delete zone methods
            await connection.query(
                'DELETE FROM shipping_zone_methods WHERE zone_id = ?',
                [zoneId]
            );

            // Delete zone
            const [result] = await connection.query(
                'DELETE FROM shipping_zones WHERE id = ?',
                [zoneId]
            );

            if (result.affectedRows === 0) {
                throw new Error('Shipping zone not found');
            }

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async getShippingZones() {
        const connection = await pool.getConnection();
        try {
            const [zones] = await connection.query(
                `SELECT z.*, 
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', m.id,
                            'name', m.name,
                            'custom_rate', zm.custom_rate
                        )
                    ) as methods
                 FROM shipping_zones z
                 JOIN shipping_zone_methods zm ON z.id = zm.zone_id
                 JOIN shipping_methods m ON zm.method_id = m.id
                 GROUP BY z.id`
            );

            return zones;
        } finally {
            connection.release();
        }
    }

    async validateAddress(address) {
        const connection = await pool.getConnection();
        try {
            // Check if address is in a supported region
            const [zones] = await connection.query(
                'SELECT id FROM shipping_zones WHERE JSON_CONTAINS(regions, ?)',
                [JSON.stringify(address.region)]
            );

            const isValid = zones.length > 0;
            const messages = [];

            if (!isValid) {
                messages.push('Address is not in a supported shipping region');
            }

            // Add any additional validation logic here
            // For example, postal code format validation, etc.

            return {
                isValid,
                messages
            };
        } finally {
            connection.release();
        }
    }
}

export default new ShippingService();