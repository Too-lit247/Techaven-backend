import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database.js';

class ProductService {
    async getAllProducts(limit = 10, offset = 0) {
        try {
            const [products] = await pool.query(`
                SELECT p.*, 
                       GROUP_CONCAT(DISTINCT c.id, ':', c.name, ':', c.slug) as categories,
                       GROUP_CONCAT(DISTINCT pi.id, ':', pi.url, ':', COALESCE(pi.alt_text, '')) as images
                FROM catalog_products p
                LEFT JOIN catalog_product_categories pc ON p.id = pc.product_id
                LEFT JOIN catalog_categories c ON pc.category_id = c.id
                LEFT JOIN catalog_product_images pi ON p.id = pi.product_id
                WHERE p.is_active = 1
                GROUP BY p.id
                LIMIT ? OFFSET ?
            `, [limit, offset]);

            return products.map(product => this.formatProductResponse(product));
        } catch (error) {
            throw new Error('Error fetching products');
        }
    }

    async getLatestProducts(limit = 10, offset = 0) {

        const db = await pool.getConnection();
        console.log("Inside getLatestProducts service");
        try {
            const [products] = await db.query(`
                SELECT p.*, 
                       GROUP_CONCAT(DISTINCT c.id, ':', c.name, ':', c.slug) as categories,
                       GROUP_CONCAT(DISTINCT pi.id, ':', pi.url, ':', COALESCE(pi.alt_text, '')) as images
                FROM catalog_products p
                LEFT JOIN catalog_product_categories pc ON p.id = pc.product_id
                LEFT JOIN catalog_categories c ON pc.category_id = c.id
                LEFT JOIN catalog_product_images pi ON p.id = pi.product_id
                WHERE p.is_active = 1
                ORDER BY p.created_at DESC
                LIMIT ? OFFSET ?
            `, [limit, offset]);

            return products.map(product => this.formatProductResponse(product));
        } catch (error) {
            throw new Error('Error fetching products');
        }
    }




    
    async getProductById(id) {
        try {
            const [products] = await pool.query(`
                SELECT p.*, 
                       GROUP_CONCAT(DISTINCT c.id, ':', c.name, ':', c.slug) as categories,
                       GROUP_CONCAT(DISTINCT pi.id, ':', pi.url, ':', COALESCE(pi.alt_text, '')) as images
                FROM catalog_products p
                LEFT JOIN catalog_product_categories pc ON p.id = pc.product_id
                LEFT JOIN catalog_categories c ON pc.category_id = c.id
                LEFT JOIN catalog_product_images pi ON p.id = pi.product_id
                WHERE p.id = ?
                GROUP BY p.id
            `, [id]);

            if (products.length === 0) return null;
            
            return this.formatProductResponse(products[0]);
        } catch (error) {
            throw new Error('Error fetching product');
        }
    }

    async createProduct(productData) {
        const connection = await pool.getConnection();
      console.log("here comes produc service", productData)
        try {
            await connection.beginTransaction();

            const productId = uuidv4();
            await connection.query(`
                INSERT INTO catalog_products (
                    id, seller_id, sku, title, short_description, 
                    long_description, price, currency, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                productId,
                productData.seller_id,
                productData.sku,
                productData.title,
                productData.short_description,
                productData.long_description,
                productData.price,
                productData.currency || 'MWK',
                productData.is_active ?? 1
            ]);

            console.log("Inserted product with ID:", productId);
            console.log("products data ", productData);
            
            if (productData.categories?.length) {
                const categoryValues = productData.categories.map(cat => [productId, cat.id]);
                await connection.query(`
                    INSERT INTO catalog_product_categories (product_id, category_id)
                    VALUES ?
                `, [categoryValues]);
            }

            await connection.commit();
            return productId;
        } catch (error) {
            console.log(error);
            await connection.rollback();
            throw new Error('Error creating product');
        } finally {
            connection.release();
        }
    }

    async updateProduct(id, productData) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            await connection.query(`
                UPDATE catalog_products 
                SET title = COALESCE(?, title),
                    short_description = COALESCE(?, short_description),
                    long_description = COALESCE(?, long_description),
                    price = COALESCE(?, price),
                    currency = COALESCE(?, currency),
                    is_active = COALESCE(?, is_active),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [
                productData.title,
                productData.short_description,
                productData.long_description,
                productData.price,
                productData.currency,
                productData.is_active,
                id
            ]);

            if (productData.categories) {
                await connection.query('DELETE FROM catalog_product_categories WHERE product_id = ?', [id]);
                const categoryValues = productData.categories.map(cat => [id, cat.id]);
                if (categoryValues.length > 0) {
                    await connection.query(`
                        INSERT INTO catalog_product_categories (product_id, category_id)
                        VALUES ?
                    `, [categoryValues]);
                }
            }

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw new Error('Error updating product');
        } finally {
            connection.release();
        }
    }

    async deleteProduct(id) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            await connection.query('DELETE FROM catalog_product_categories WHERE product_id = ?', [id]);
            await connection.query('DELETE FROM catalog_product_images WHERE product_id = ?', [id]);
            
            const [result] = await connection.query(
                'DELETE FROM catalog_products WHERE id = ?',
                [id]
            );

            await connection.commit();
            return result.affectedRows > 0;
        } catch (error) {
            await connection.rollback();
            throw new Error('Error deleting product');
        } finally {
            connection.release();
        }
    }

    async searchProducts(query) {
        try {
            const [products] = await pool.query(`
                SELECT p.*, 
                       GROUP_CONCAT(DISTINCT c.id, ':', c.name, ':', c.slug) as categories,
                       GROUP_CONCAT(DISTINCT pi.id, ':', pi.url, ':', COALESCE(pi.alt_text, '')) as images
                FROM catalog_products p
                LEFT JOIN catalog_product_categories pc ON p.id = pc.product_id
                LEFT JOIN catalog_categories c ON pc.category_id = c.id
                LEFT JOIN catalog_product_images pi ON p.id = pi.product_id
                WHERE p.is_active = 1 
                AND (
                    p.title LIKE ? OR 
                    p.short_description LIKE ? OR 
                    p.long_description LIKE ?
                )
                GROUP BY p.id
            `, [`%${query}%`, `%${query}%`, `%${query}%`]);
            console.log("Search products result:", products);

            return products.map(product => this.formatProductResponse(product));
        } catch (error) {
            throw new Error('Error searching products');
        }
    }

    formatProductResponse(product) {
        // Format categories
        const categoriesStr = product.categories;
        const categories = categoriesStr
            ? categoriesStr.split(',').map(cat => {
                const [id, name, slug] = cat.split(':');
                return { id: Number(id), name, slug };
            })
            : [];

        // Format images
        const imagesStr = product.images;
        const images = imagesStr
            ? imagesStr.split(',').map(img => {
                const [id, url, alt_text] = img.split(':');
                return { id, url, alt_text: alt_text || undefined };
            })
            : [];

        return {
            ...product,
            categories,
            images,
            is_active: Boolean(product.is_active)
        };
    }

    async updateStock(productId, quantity) {
        try {
            const [result] = await pool.query(`
                UPDATE catalog_products 
                SET stock = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [quantity, productId]);

            return result.affectedRows > 0;
        } catch (error) {
            throw new Error('Error updating product stock');
        }
    }
}

export default new ProductService();