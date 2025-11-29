import  pool  from  '../config/database.js';
import { AppError } from '../utils/error.js';
import { v4 as uuidv4 } from 'uuid';
class ShopService {
    
      
    // Get all shops with filters and pagination
    async getShops({ page = 1, limit = 10, search = '', business_name = '', sort = 'created_at' }) {
        const offset = (page - 1) * limit;
        const db =  await pool.getConnection();
        let query = 'SELECT * FROM catalog_sellers';
        const params = [];

        if (search) {
            query += ' AND (business_name LIKE ?)';
            params.push(`%${search}%`);
        }


        // Add sorting
        query += ` ORDER BY ${sort} DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const [shops] = await db.query(query, params);
        const total = await db.query('SELECT COUNT(id) FROM catalog_sellers');

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
    async getShopById(user_id) {
          const db = await pool.getConnection();

        const [shop] = await db.query('SELECT * FROM catalog_sellers WHERE user_id = ?', [user_id]);
       
        return shop[0];
    }

    // Get shop products
    async getShopProducts(shopId, { page = 1, limit = 10, category = '', sort = 'createdAt' }) {
        const offset = (page - 1) * limit;
        let query = 'SELECT * FROM products WHERE shop_id = ?';
        const params = [shopId];

        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }

        query += ` ORDER BY ${sort} DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const [products] = await db.query(query, params);
        const [{ total }] = await db.query('SELECT COUNT(*) as total FROM products WHERE shop_id = ?', [shopId]);

        return {
            products,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total
            }
        };
    }

    // Create new shop
    async createShop(data) {
        console.log("shop service ...", data);

        const db =  await pool.getConnection();
        const {user_id , business_name, registration_number} = data;
        const id = uuidv4();
        const shop = await this.getShopById(user_id);

        if(!shop){
try {
            

        const [result] = await db.query(`INSERT INTO catalog_sellers (id, user_id, business_name, registration_number) 
        VALUES (?, ?,?,?)`, [id,user_id, business_name, registration_number]);
      
            console.log("here comes the data ", result);

        } catch (error) {
            console.error("Error creating shop: ", error);          
        }
        }
        else{
            throw new AppError('Shop already exists for this user', 400);
        }

        
    return this.getShopById(user_id);
    }

    // Update shop details
    async updateShop(user_id, data) {
        const db = await pool.getConnection();
        const shop = await this.getShopById(user_id);
        if (!shop) {
            throw new AppError('Shop not found', 404);
        }

        if (shop.user_id !== user_id) {
            throw new AppError('Unauthorized', 403);
        }

        const { business_name, registration_number } = data;
        await db.query(
            'UPDATE catalog_sellers SET business_name = ?, registration_number = ? WHERE user_id = ?',
            [business_name,registration_number, user_id]
        );

        return this.getShopById(user_id);
    }

    // Delete shop
    async deleteShop(user_id) {
        const db = await pool.getConnection();
        const shop = await this.getShopById(user_id);
        if (!shop) {
            throw new AppError('Shop not found', 404);
        }

        if (shop.user_id !== user_id) {
            throw new AppError('Unauthorized', 403);
        }

        await db.query('DELETE FROM calalog_sellers WHERE user_id = ?', [user_id]);
    }

    // Get shop orders
    async getShopOrders(user_id, { page = 1, limit = 10, status = '' }) {
        const shop = await this.getShopById(user_id);
        if (!shop) {
            throw new AppError('Shop not found', 404);
        }

        if (shop.user_id !== user_id) {
            throw new AppError('Unauthorized', 403);
        }

        const offset = (page - 1) * limit;
        let query = 'SELECT * FROM orders WHERE shop_id = ?';
        const params = [shopId];

        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const [orders] = await db.query(query, params);
        const [{ total }] = await db.query('SELECT COUNT(*) as total FROM orders WHERE shop_id = ?', [shopId]);

        return {
            orders,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total
            }
        };
    }

    // Update order status
    async updateOrderStatus(shopId, orderId, status, userId) {
        const shop = await this.getShopById(shopId);
        if (!shop) {
            throw new AppError('Shop not found', 404);
        }

        if (shop.seller_id !== userId) {
            throw new AppError('Unauthorized', 403);
        }

        const [order] = await db.query('SELECT * FROM orders WHERE id = ? AND shop_id = ?', [orderId, shopId]);
        if (!order[0]) {
            throw new AppError('Order not found', 404);
        }

        await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
        return order[0];
    }

    // Admin: Get pending shops
    async getPendingShops({ page = 1, limit = 10 }) {
        const offset = (page - 1) * limit;
        const [shops] = await db.query(
            'SELECT * FROM shops WHERE status = "pending" ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [limit, offset]
        );
        const [{ total }] = await db.query('SELECT COUNT(*) as total FROM shops WHERE status = "pending"');

        return {
            shops,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total
            }
        };
    }

    // Admin: Approve shop
    async approveShop(shopId) {
        const shop = await this.getShopById(shopId);
        if (!shop) {
            throw new AppError('Shop not found', 404);
        }

        await db.query('UPDATE shops SET status = "approved" WHERE id = ?', [shopId]);
        return this.getShopById(shopId);
    }

    // Admin: Reject shop
    async rejectShop(shopId, reason) {
        const shop = await this.getShopById(shopId);
        if (!shop) {
            throw new AppError('Shop not found', 404);
        }

        await db.query('UPDATE shops SET status = "rejected", rejection_reason = ? WHERE id = ?', [reason, shopId]);
    }

    // Admin: Suspend shop
    async suspendShop(shopId, reason, duration) {
        const shop = await this.getShopById(shopId);
        if (!shop) {
            throw new AppError('Shop not found', 404);
        }

        const suspendedUntil = new Date();
        suspendedUntil.setDate(suspendedUntil.getDate() + duration);

        await db.query(
            'UPDATE shops SET status = "suspended", suspension_reason = ?, suspended_until = ? WHERE id = ?',
            [reason, suspendedUntil, shopId]
        );

        return this.getShopById(shopId);
    }
}

export default ShopService;