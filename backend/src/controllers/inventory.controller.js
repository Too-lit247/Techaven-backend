import InventoryService from 'services/inventory.service.js';

import { validateShopData } from '../validators/shop.validator.js';
import { AppError } from '../utils/error.js';

const inventoryService = new InventoryService();

const inventoryController = {
    // Get all inventories
    async getAllInventory(req, res, next) {
        try {
            console.log("Inside getAllInventory controller");
            const { page = 1, limit = 10, search, sort } = req.query;
            const inventory = await inventoryService.getAllInventory({ page, limit, search, sort });
            res.json(inventory);
        } catch (error) {
            next(error);
        }
    },

    // Get single shop details
    async getProductInventory(req, res, next) {
        try {
            const { product_id, inventory_id } = req.body;
           const inventory = await inventoryService.getProductInventory( product_id );
            console.log("Inventory details ", inventory);

            
            res.json(inventory);
        } catch (error) {
            next(error);
        }
    },

    // Create new shop
    async addInventory(req, res, next) {
        try {
           
 
            console.log("here ", req.body);
                    const inventory = await inventoryService.addProductInvenntory({
                ...req.body,
                productId : req.body.product_id
            });
            console.log("here is the shop created", inventory);
            res.status(201).json(inventory);
        } catch (error) {
            next(error);
        }
    },

    // Update shop details
    async updateInventory(req, res, next) {
        try {
            const { inventory_id, product_id, quantity, reserved, location_code } = req.body;


            const inventory = await inventoryService.updateProductInventory(req.body, req.user_id);
            res.json(inventory);
        } catch (error) {
            next(error);
        }
    },

    // Delete shop
    async deleteInventory(req, res, next) {
        try {
            const { inventory_id } = req.body;
        const results =  await inventoryService.deleteInventory( inventory_id );
            
        
        res.status(204).end();
        } catch (error) {
            next(error);
        }
    },

   
};

export default inventoryController;