import express from 'express';
import inventoryController from '../controllers/inventory.controller.js';

import { auth, checkRole } from '../middleware/auth.js';
import { validateShop } from '../middleware/validation.js';
import { cacheMiddleware, invalidateCache } from '../middleware/cache.js';

const router = express.Router();

// Public shop routes
router.get(
    '/inventories',
   // cacheMiddleware(300), // Cache for 5 minutes
    inventoryController.getAllInventory
);

router.get(
    '/:inventoryId',
    cacheMiddleware(300),
    inventoryController.getProductInventory
);



// Seller routes (protected)
router.post(
    '/add',
    //auth,
    //validateShop,
inventoryController.addInventory
);

router.put(
    '/:inventoryId',
inventoryController.updateInventory    
);

router.delete(
    '/:inventoryId',
    auth,
    inventoryController.deleteInventory
);


export default router;