import express from 'express';
import orderController from '../controllers/order.controller.js';
import { auth, checkRole } from '../middleware/auth.js';
import {  userValidationRules, paginationRules } from '../middleware/validation.js';

const router = express.Router();

// Customer routes
router.post(
    '/',
    auth,
    //validate(orderValidationRules.create),
    orderController.createOrder
);
router.get('all-orders', orderController.getAllOrdersPublic); // Public route to get all orders


router.get(
    '/my-orders',
    auth,
    paginationRules,
    orderController.getUserOrders
);

router.get(
    '/my-orders/:orderId',
    auth,
    orderController.getOrder
);

router.post(
    '/:orderId/cancel',
    auth,
    orderController.cancelOrder
);

// Admin routes
router.get(
    '/',
    //auth,
    //checkRole(['admin']),
    paginationRules,
    orderController.getAllOrders
);

router.put(
    '/:orderId/status',
    auth,
    checkRole(['admin']),
    //validate(orderValidationRules.updateStatus),
    orderController.updateOrderStatus
);

export default router;