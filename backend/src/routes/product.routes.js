import express from 'express';
import productController from '../controllers/product.controller.js';
import { auth, checkRole } from '../middleware/auth.js';
import { validateRequest as validate, productValidationRules, paginationRules } from '../middleware/validation.js';
import { uploadSingleFile } from '../middleware/upload.js';
import { cacheMiddleware, invalidateCache } from '../middleware/cache.js';

const router = express.Router();

// Public routes
router.get(
    '/',
    paginationRules,
    cacheMiddleware(300), // Cache for 5 minutes
    productController.getAllProducts
);
router.get(
    '/latest',
    paginationRules,
    cacheMiddleware(300), // Cache for 5 minutes
    productController.getLatestProducts
);

router.get(
    '/search',
    paginationRules,
    productController.searchProducts
);

router.get(
    '/:productId',
    cacheMiddleware(300),
    productController.getProductById
);

// Protected routes (Admin only)
router.post(
    '/',
    // auth,
   // checkRole(['seller', 'admin']),
    uploadSingleFile('image'),
    productValidationRules.create,
    invalidateCache(['/products']),
    productController.createProduct
);

router.put(
    '/:productId',
    auth,
    checkRole(['seller', 'admin']),
    uploadSingleFile('image'),
    productValidationRules.update,
    invalidateCache(['/products']),
    productController.updateProduct
);

router.delete(
    '/:productId',
    auth,
    checkRole(['seller', 'admin']),
    invalidateCache(['/products']),
    productController.deleteProduct
);

router.put(
    '/:productId/stock',
    auth,
    checkRole(['seller']),
    productController.updateStock
);

export default router;