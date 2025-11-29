import mysql from 'mysql2/promise';
import config from '../config/config.js';
import { v4 as uuidv4 } from 'uuid';
import ShopService from './shop.service.js';
import pool from '../config/database.js';




class OrderService{
    
    async createOrder(user_id, items, shippingAddress, paymentMethod) {
        const connection = await pool.getConnection();
     let full_name = "";
     let line1 = "0888001347"
     console.log("creating an order for ", user_id)

console.log("full name initially ", full_name)
     try {
            await connection.beginTransaction();

   const order_id = uuidv4();
            // Create order
            //create order address

console.log("order id", order_id);
             try {
            const [userResults] = await pool.query(`
                SELECT *
                FROM auth_user_profile
                WHERE user_id = ?
            `, [user_id]);
            console.log("user results are", userResults);


            if (userResults[0].length === 0) return null;

            const user = userResults[0];
            console.log("first user", user)
            full_name = user.full_name;
            line1 = user.phone;
            console.log("full name is :", full_name); 
            console.log("line one for ", line1); 
            return full_name;
        } catch (error) {
            throw new Error('Failed to fetch user');
        }
        const order_addresses_id = uuidv4();

        console.log(" order addresses id generated", order_addresses_id)
            const [orderAddressesResults] = await connection.query(`INSERT INTO order_addresses(id,user_id, full_name, line1) VALUES (?,?,?,?)`,
                [order_addresses_id,user_id, full_name, line1])
            
            const [orderResult] = await connection.query(
                `INSERT INTO order_orders (id, user_id, shipping_address, payment_method, status, created
                _at)
                 VALUES (?, ?, ?, 'pending', NOW())`,
                [userId, JSON.stringify(shippingAddress), paymentMethod]
            );

            const orderId = orderResult.insertId;

            // Calculate total and insert order items
            let orderTotal = 0;
            for (const item of items) {
                // Get product details and check stock
                const [products] = await connection.query(
                    'SELECT price, stock FROM products WHERE id = ?',
                    [item.productId]
                );

                if (!products.length) {
                    throw new Error(`Product ${item.productId} not found`);
                }

                const product = products[0];
                if (product.stock < item.quantity) {
                    throw new Error(`Insufficient stock for product ${item.productId}`);
                }

                // Insert order item
                await connection.query(
                    `INSERT INTO order_items (order_id, product_id, quantity, price)
                     VALUES (?, ?, ?, ?)`,
                    [orderId, item.productId, item.quantity, product.price]
                );

                // Update product stock
                await connection.query(
                    'UPDATE products SET stock = stock - ? WHERE id = ?',
                    [item.quantity, item.productId]
                );

                orderTotal += product.price * item.quantity;
            }

            // Update order total
            await connection.query(
                'UPDATE orders SET total_amount = ? WHERE id = ?',
                [orderTotal, orderId]
            );

            await connection.commit();

            // Get complete order details
            const [orders] = await connection.query(
                `SELECT o.*, JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'productId', oi.product_id,
                        'quantity', oi.quantity,
                        'price', oi.price
                    )
                ) as items
                 FROM orders o
                 JOIN order_items oi ON o.id = oi.order_id
                 WHERE o.id = ?
                 GROUP BY o.id`,
                [orderId]
            );

            return orders[0];
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async getOrderById(orderId, userId) {
        const connection = await pool.getConnection();
        try {
            const [orders] = await connection.query(
                `SELECT o.*, JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'productId', oi.product_id,
                        'quantity', oi.quantity,
                        'price', oi.price,
                        'productName', p.name,
                        'productImage', p.image_url
                    )
                ) as items
                 FROM orders o
                 JOIN order_items oi ON o.id = oi.order_id
                 JOIN products p ON oi.product_id = p.id
                 WHERE o.id = ? AND o.user_id = ?
                 GROUP BY o.id`,
                [orderId, userId]
            );

            return orders.length ? orders[0] : null;
        } finally {
            connection.release();
        }
    }

    async getUserOrders(userId, page, limit) {
        const connection = await pool.getConnection();
        try {
            const offset = (page - 1) * limit;

            const [orders] = await connection.query(
                `SELECT o.*, JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'productId', oi.product_id,
                        'quantity', oi.quantity,
                        'price', oi.price,
                        'productName', p.name,
                        'productImage', p.image_url
                    )
                ) as items
                 FROM orders o
                 JOIN order_items oi ON o.id = oi.order_id
                 JOIN products p ON oi.product_id = p.id
                 WHERE o.user_id = ?
                 GROUP BY o.id
                 ORDER BY o.created_at DESC
                 LIMIT ? OFFSET ?`,
                [userId, limit, offset]
            );

            const [totalCount] = await connection.query(
                'SELECT COUNT(DISTINCT id) as count FROM orders WHERE user_id = ?',
                [userId]
            );

            return {
                orders,
                total: totalCount[0].count,
                page,
                totalPages: Math.ceil(totalCount[0].count / limit)
            };
        } finally {
            connection.release();
        }
    }

    async updateOrderStatus(orderId, status) {
        const connection = await pool.getConnection();
        try {
            const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
            if (!validStatuses.includes(status)) {
                throw new Error('Invalid order status');
            }

            const [result] = await connection.query(
                'UPDATE orders SET status = ? WHERE id = ?',
                [status, orderId]
            );

            if (result.affectedRows === 0) {
                throw new Error('Order not found');
            }
        } finally {
            connection.release();
        }
    }

    async cancelOrder(orderId, userId) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Get order details
            const [orders] = await connection.query(
                'SELECT status FROM orders WHERE id = ? AND user_id = ?',
                [orderId, userId]
            );

            if (!orders.length) {
                throw new Error('Order not found');
            }

            if (!['pending', 'processing'].includes(orders[0].status)) {
                throw new Error('Order cannot be cancelled');
            }

            // Get order items to restore stock
            const [items] = await connection.query(
                'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
                [orderId]
            );

            // Restore stock for each item
            for (const item of items) {
                await connection.query(
                    'UPDATE products SET stock = stock + ? WHERE id = ?',
                    [item.quantity, item.product_id]
                );
            }

            // Update order status
            await connection.query(
                'UPDATE orders SET status = "cancelled" WHERE id = ?',
                [orderId]
            );

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async getAllOrders(page, limit, status) {

        console.log("Fetching all orders with status:", status);
        const connection = await pool.getConnection();

        console.log("Database connection established for fetching all orders", connection);
        try {
            const offset = (page - 1) * limit;
            let query = `
                SELECT o.*, u.email as user_email, JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'productId', oi.product_id,
                        'quantity', oi.quantity,
                        'price', oi.unit_price,
                        'productName', p.title
                    )
                ) as items
                FROM order_orders o
                JOIN auth_users u ON o.buyer_id = u.id
                JOIN order_items oi ON o.id = oi.order_id
                JOIN catalog_products p ON oi.product_id = p.id
            `;
            
            const params = [];
            if (status) {
                query += ' WHERE o.status = ?';
                params.push(status);
            }

            query += ' GROUP BY o.id ORDER BY o.placed_at DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const [orders] = await connection.query(query, params);

            const [totalCount] = await connection.query(
                'SELECT COUNT(DISTINCT id) as count FROM order_orders' + 
                (status ? ' WHERE status = ?' : ''),
                status ? [status] : []
            );

            return {
                orders,
                total: totalCount[0].count,
                page,
                totalPages: Math.ceil(totalCount[0].count / limit)
            };
        } finally {
            connection.release();
        }
    }
}

export default new OrderService();