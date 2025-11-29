import ShopService from '../services/shop.service.js';
import { validateShopData } from '../validators/shop.validator.js';
import { AppError } from '../utils/error.js';

const shopService = new ShopService();

const shopController = {
    // Get all shops
    async getShops(req, res, next) {
        try {
            const { page = 1, limit = 10, search, sort } = req.query;
            const shops = await shopService.getShops({ page, limit, search, sort });
            res.json(shops);
        } catch (error) {
            next(error);
        }
    },

    // Get single shop details
    async getShopDetails(req, res, next) {
        try {
            const { shopId } = req.params;
            const shop = await shopService.getShopById(shopId);
            console.log("shop details ", shop);

            if (!shop) {
                throw new AppError('Shop not found', 404);
            }
            res.json(shop);
        } catch (error) {
            next(error);
        }
    },

    // Get shop products
    async getShopProducts(req, res, next) {
        try {
            const { shopId } = req.params;
            const { page = 1, limit = 10, category, sort } = req.query;
            const products = await shopService.getShopProducts(shopId, { page, limit, category, sort });
            res.json(products);
        } catch (error) {
            next(error);
        }
    },

    // Create new shop
    async createShop(req, res, next) {
        try {
           
 
            console.log("here ", req.body);
                    const shop = await shopService.createShop({
                ...req.body,
                seller_id : req.body.user_id
            });
            console.log("here is the shop created", shop);
            res.status(201).json(shop);
        } catch (error) {
            next(error);
        }
    },

    // Update shop details
    async updateShop(req, res, next) {
        try {
            const { shopId } = req.params;
            const validationErrors = validateShopData(req.body);
            if (validationErrors.length > 0) {
                throw new AppError('Validation failed', 400, validationErrors);
            }

            const shop = await shopService.updateShop(shopId, req.body, req.user.id);
            res.json(shop);
        } catch (error) {
            next(error);
        }
    },

    // Delete shop
    async deleteShop(req, res, next) {
        try {
            const { shopId } = req.params;
            await shopService.deleteShop(shopId, req.user.id);
            res.status(204).end();
        } catch (error) {
            next(error);
        }
    },

    // Get shop orders
    async getShopOrders(req, res, next) {
        try {
            const { shopId } = req.params;
            const { page = 1, limit = 10, status } = req.query;
            const orders = await shopService.getShopOrders(shopId, req.user.id, { page, limit, status });
            res.json(orders);
        } catch (error) {
            next(error);
        }
    },

    // Update order status
    async updateOrderStatus(req, res, next) {
        try {
            const { shopId, orderId } = req.params;
            const { status } = req.body;
            const order = await shopService.updateOrderStatus(shopId, orderId, status, req.user.id);
            res.json(order);
        } catch (error) {
            next(error);
        }
    },

    // Admin: Get pending shop applications
    async getPendingShops(req, res, next) {
        try {
            const { page = 1, limit = 10 } = req.query;
            const shops = await shopService.getPendingShops({ page, limit });
            res.json(shops);
        } catch (error) {
            next(error);
        }
    },

    // Admin: Approve shop
    async approveShop(req, res, next) {
        try {
            const { shopId } = req.params;
            const shop = await shopService.approveShop(shopId);
            res.json(shop);
        } catch (error) {
            next(error);
        }
    },

    // Admin: Reject shop
    async rejectShop(req, res, next) {
        try {
            const { shopId } = req.params;
            const { reason } = req.body;
            await shopService.rejectShop(shopId, reason);
            res.status(204).end();
        } catch (error) {
            next(error);
        }
    },

    // Admin: Suspend shop
    async suspendShop(req, res, next) {
        try {
            const { shopId } = req.params;
            const { reason, duration } = req.body;
            const shop = await shopService.suspendShop(shopId, reason, duration);
            res.json(shop);
        } catch (error) {
            next(error);
        }
    }
};

export default shopController;