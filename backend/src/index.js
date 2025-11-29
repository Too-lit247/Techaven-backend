import express from 'express';
import cors from 'cors';
import productRoutes from './routes/product.routes.js';
import categoryRoutes from './routes/category.routes.js';
import userRoutes from './routes/user.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import shopRoutes from './routes/shop.routes.js';
import shippingRoutes from './routes/shipping.routes.js';
import orderRoutes from './routes/order.routes.js';

const app = express();

console.log('Starting Techaven API End Points...');

console.log('Setting up middleware...');
// Middleware
app.use(cors());

console.log('Configuring body parsers...');

// Special handling for Stripe webhook route
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

console.log('Configuring regular body parsers...');

// Regular middleware for other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/shippings', shippingRoutes);
app.use('/api/orders', orderRoutes);


// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

app.listen(666, "0.0.0.0", () => {
    console.log(`Server is running on port 666`);
});