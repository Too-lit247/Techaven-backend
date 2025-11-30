import express from 'express';
import userRoutes from './user.routes.js';
import productRoutes from './product.routes.js';
import orderRoutes from './order.routes.js';
import reviewRoutes from './review.routes.js';
import promotionRoutes from './promotion.routes.js';
import supportRoutes from './support.routes.js';
import shippingRoutes from './shipping.routes.js';
import shopRoutes from './shop.routes.js'
import inventoryRoutes from './inventory.routes.js';
const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

// Mount routes
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/reviews', reviewRoutes);
router.use('/promotions', promotionRoutes);
router.use('/support', supportRoutes);
router.use('/shipping', shippingRoutes);
router.use('shops', shopRoutes);
router.use('/inventory', inventoryRoutes);

export default router;