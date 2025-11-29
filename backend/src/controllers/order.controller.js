import orderService from '../services/order.service.js';

class OrderController {
    async createOrder(req, res) {
        try {
            const userId = req.user.id;
            const { items, shippingAddress, paymentMethod } = req.body;
            const order = await orderService.createOrder(userId, items, shippingAddress, paymentMethod);
            res.status(201).json({
                success: true,
                data: order
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to create order'
            });
        }
    }
async getAllOrdersPublic(req, res) {
        try {
            console.log('Fetching all orders - public route');
            const { page = 1, limit = 10, status } = req.query;
            const orders = await orderService.getAllOrders(
                parseInt(page),
                parseInt(limit),
                status
            );
            res.json({
                success: true,
                data: orders
            });
        }

        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch orders'
            });
        }
    }
    async getOrder(req, res) {
        try {
            const { orderId } = req.params;
            const userId = req.user.id;
            const order = await orderService.getOrderById(orderId, userId);
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }
            res.json({
                success: true,
                data: order
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch order'
            });
        }
    }

    async getUserOrders(req, res) {
        try {
            const userId = req.user.id;
            const { page = 1, limit = 10 } = req.query;
            const orders = await orderService.getUserOrders(userId, parseInt(page), parseInt(limit));
            res.json({
                success: true,
                data: orders
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch orders'
            });
        }
    }

    async updateOrderStatus(req, res) {
        try {
            const { orderId } = req.params;
            const { status } = req.body;
            await orderService.updateOrderStatus(orderId, status);
            res.json({
                success: true,
                message: 'Order status updated successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to update order status'
            });
        }
    }

    async cancelOrder(req, res) {
        try {
            const { orderId } = req.params;
            const userId = req.user.id;
            await orderService.cancelOrder(orderId, userId);
            res.json({
                success: true,
                message: 'Order cancelled successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to cancel order'
            });
        }
    }

    async getAllOrders(req, res) {
        try {
            const { page = 1, limit = 10, status } = req.query;
            const orders = await orderService.getAllOrders(
                parseInt(page),
                parseInt(limit),
                status
            );
            res.json({
                success: true,
                data: orders
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch orders'
            });
        }
    }
}

export default new OrderController();