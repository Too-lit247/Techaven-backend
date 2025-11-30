import productService from '../services/product.service.js';

class ProductController {
    async getAllProducts(req, res) {
        try {
            const limit = Number(req.query.limit) || 10;
            const offset = Number(req.query.offset) || 0;
            const products = await productService.getAllProducts(limit, offset);
            res.json({
                success: true,
                data: products
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    }

     async getLatestProducts(req, res) {
        console.log("Inside getLatestProducts controller");
        try {
            const limit = Number(req.query.limit) || 10;
            const offset = Number(req.query.offset) || 0;
            const products = await productService.getLatestProducts(limit, offset);
            res.json({
                success: true,
                data: products
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    }

    async getProductById(req, res) {
        try {
            const product = await productService.getProductById(req.params.id);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }
            res.json({
                success: true,
                data: product
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    }

    async createProduct(req, res) {
        try {
            const productId = await productService.createProduct(req.body);
            res.status(201).json({
                success: true,
                data: {
                    id: productId,
                    message: 'Product created successfully'
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    }

    async updateProduct(req, res) {
        try {
            const updated = await productService.updateProduct(req.params.id, req.body);
            if (!updated) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }
            res.json({
                success: true,
                message: 'Product updated successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    }

    async deleteProduct(req, res) {
        try {
            const deleted = await productService.deleteProduct(req.params.id);
            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }
            res.json({
                success: true,
                message: 'Product deleted successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    }

    async searchProducts(req, res) {
        try {
            const query = req.query.q;
            if (!query) {
                return res.status(400).json({
                    success: false,
                    message: 'Search query is required'
                });
            }
            const products = await productService.searchProducts(query);
            res.json({
                success: true,
                data: products
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    }

    async toggleFeatured(req, res) {
        try {
            const { productId } = req.params;
            const updated = await productService.toggleFeatured(productId);
            if (!updated) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }
            res.json({
                success: true,
                message: 'Product featured status updated successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    }

    async updateStock(req, res) {
        try {
            const { productId } = req.params;
            const { quantity } = req.body;
            
            if (typeof quantity !== 'number') {
                return res.status(400).json({
                    success: false,
                    message: 'Quantity must be a number'
                });
            }

            const updated = await productService.updateStock(productId, quantity);
            if (!updated) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }
            res.json({
                success: true,
                message: 'Product stock updated successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    }
}

export default new ProductController();