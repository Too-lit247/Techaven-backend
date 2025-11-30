import { get } from 'http';
import  pool  from  '../config/database.js';
import { AppError } from '../utils/error.js';
import { v4 as uuidv4 } from 'uuid';
class InventoryService {
    
      
    // Get all shops with filters and pagination
    async getAllInventory({ page = 1, limit = 10, search = '', location_code = '', sort = 'updated_at' }) {
        const offset = (page - 1) * limit;
        const db =  await pool.getConnection();
        let query = 'SELECT * FROM inventory_inventories';
        const params = [];

        if (search) {
            query += ' AND (location_code LIKE ?)';
            params.push(`%${search}%`);
        }


        // Add sorting
        query += ` ORDER BY ${sort} DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const [shops] = await db.query(query, params);
        const total = await db.query('SELECT COUNT(id) FROM inventory_inventories');

        return {
            shops,
            pagination: {
                page: page,
                limit: limit,
                total
            }
        };
    }

    // Get single shop by ID
    async getProductInventory(product_id) {
          const db = await pool.getConnection();

        const [product_inventory] = await db.query('SELECT * FROM inventory_inventories WHERE product_id = ?', [user_id]);
       
        return product_inventory[0];
    }

    // Get shop products
    async addProductInvenntory(productId, data ) {
        const db = await pool.getConnection();
        console.log("inventory service ...", data);

        const {product_id, quantity, reserved ,location_code} = data.body;
        const id = uuidv4();
        try {
            const checkProductInventory = await this.getProductInventory(product_id);
            if (checkProductInventory) {
                throw new AppError('Inventory for this product already exists', 400);
            }


        let query = 'INSERT INTO inventory_inventories (id, product_id, quantity, reserved, location_code) VALUES (?, ?, ?, ?, ?)';
        const params = [id, product_id, quantity, reserved, location_code];
        const [result] = await db.query(query, params);
       
            console.log("here comes the data ", result);
        } catch (error) {
  console.error("Error adding product inventory:", error);
            throw new Error('Error adding product inventory');          
        }

        return this.getProductInventory(product_id);
    }

  

    // Update shop details
    async updateProductInventory(productId, data) {
        const db = await pool.getConnection();
        const product_inventory = await this.getProductInventory(data.body.product_id);
        if (!product_inventory) {
            throw new AppError('Inventory not found', 404);
        }

        const {product_id, quantity, reserved, location_code } = data.body;
        const results = await db.query(
            'UPDATE inventory_inventories SET quantity = ?, reserved = ? WHERE product_id = ?',
            [quantity, reserved, product_id]
        );
        console.log("update results ", results);

        return this.getProductInventory(product_id);
    }

    // Delete shop
    async deleteInventory(inventory_id) {
        const db = await pool.getConnection();


const results = await db.query('DELETE FROM inventory_inventories WHERE id = ?', [inventory_id]);

return results;
    }
  
}

export default InventoryService;