import shippingService from '../services/shipping.service.js';

class ShippingController {
    async calculateShipping(req, res) {
        try {
            const { items, address } = req.body;
            const shippingOptions = await shippingService.calculateShipping(items, address);
            res.json({
                success: true,
                data: shippingOptions
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to calculate shipping'
            });
        }
    }

    async getShippingMethods(req, res) {
        try {
            console.log("Fetching shipping methods");
            const methods = await shippingService.getShippingMethods();
 
 console.log("Shipping methods retrieved:", methods);
            res.json({
                success: true,
                data: methods
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch shipping methods'
            });
        }
    }

    async updateShippingMethod(req, res) {
        try {
            const { methodId } = req.params;
            const updateData = req.body;
            await shippingService.updateShippingMethod(methodId, updateData);
            res.json({
                success: true,
                message: 'Shipping method updated successfully'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to update shipping method'
            });
        }
    }

    async addShippingMethod(req, res) {
        try {
            const { name, description, baseRate, ratePerKg } = req.body;
            const method = await shippingService.addShippingMethod(name, description, baseRate, ratePerKg);
            res.status(201).json({
                success: true,
                data: method
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to add shipping method'
            });
        }
    }

    async deleteShippingMethod(req, res) {
        try {
            const { methodId } = req.params;
            await shippingService.deleteShippingMethod(methodId);
            res.json({
                success: true,
                message: 'Shipping method deleted successfully'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to delete shipping method'
            });
        }
    }

    async addShippingZone(req, res) {
        try {
            const { name, regions, methodIds, rates } = req.body;
            const zone = await shippingService.addShippingZone(name, regions, methodIds, rates);
            res.status(201).json({
                success: true,
                data: zone
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to add shipping zone'
            });
        }
    }

    async updateShippingZone(req, res) {
        try {
            const { zoneId } = req.params;
            const updateData = req.body;
            await shippingService.updateShippingZone(zoneId, updateData);
            res.json({
                success: true,
                message: 'Shipping zone updated successfully'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to update shipping zone'
            });
        }
    }

    async deleteShippingZone(req, res) {
        try {
            const { zoneId } = req.params;
            await shippingService.deleteShippingZone(zoneId);
            res.json({
                success: true,
                message: 'Shipping zone deleted successfully'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to delete shipping zone'
            });
        }
    }

    async getShippingZones(req, res) {
        try {
            const zones = await shippingService.getShippingZones();
            res.json({
                success: true,
                data: zones
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch shipping zones'
            });
        }
    }

    async validateAddress(req, res) {
        try {
            const { address } = req.body;
            const validationResult = await shippingService.validateAddress(address);
            res.json({
                success: true,
                data: validationResult
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to validate address'
            });
        }
    }
}

export default new ShippingController();