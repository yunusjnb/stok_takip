const ProductModel = require('../models/ProductModel');

class ProductController {

    static async getAllProducts(req, res) {
        try {
            const [rows] = await ProductModel.findAll();

            // Business Logic: Safe parsing and transformations
            const products = rows.map((product) => {
                let stock = 0;

                if (product.process_type === 'al-sat') {
                    if (product.stock !== undefined && product.stock !== null && product.stock !== "") {
                        stock = parseFloat(product.stock);
                    }
                } else if (product.process_type === 'üretilen') {
                    if (product.recipe_stock !== undefined && product.recipe_stock !== null) {
                        stock = parseFloat(product.recipe_stock);
                    } else {
                        stock = 9999;
                    }
                }

                if (isNaN(stock)) stock = 0;

                let minStock = 0;
                if (product.min_stock !== undefined && product.min_stock !== null && product.min_stock !== "") {
                    minStock = parseFloat(product.min_stock);
                    if (isNaN(minStock)) minStock = 0;
                }

                return {
                    ...product,
                    process_type: product.process_type || "",
                    stock: stock,
                    min_stock: minStock,
                };
            });

            res.json(products);
        } catch (error) {
            console.error("Get products error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async getProductById(req, res) {
        try {
            const [rows] = await ProductModel.findById(req.params.id);
            if (rows.length === 0) {
                return res.status(404).json({ error: "Ürün bulunamadı" });
            }

            const product = rows[0];
            // Safe parsing
            if (product.stock !== undefined && product.stock !== null && product.stock !== "") {
                product.stock = parseFloat(product.stock);
                if (isNaN(product.stock)) product.stock = 0;
            } else {
                product.stock = 0;
            }

            if (product.min_stock !== undefined && product.min_stock !== null && product.min_stock !== "") {
                product.min_stock = parseFloat(product.min_stock);
                if (isNaN(product.min_stock)) product.min_stock = 0;
            } else {
                product.min_stock = 0;
            }

            res.json(product);
        } catch (error) {
            console.error("Get product error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async getProductRecipe(req, res) {
        try {
            const [rows] = await ProductModel.findRecipeByProductId(req.params.id);
            res.json(rows);
        } catch (error) {
            console.error("Get product recipe error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async createProduct(req, res) {
        try {
            const {
                name, price, recipe, process_type = "üretilen", product_type = 1,
                stock, min_stock, wholesaler_id, unit_price, min_purch,
            } = req.body;

            if (!name || !price) {
                return res.status(400).json({ error: "Ürün adı ve fiyat gerekli" });
            }

            let parsedRecipe = null;
            if (recipe) {
                try {
                    parsedRecipe = typeof recipe === "string" ? JSON.parse(recipe) : recipe;
                } catch (e) {
                    parsedRecipe = null;
                }
            }

            let imagePath = "";
            if (req.file) {
                imagePath = `/uploads/product/${req.file.filename}`;
            }

            const connection = await ProductModel.getConnection();
            await connection.beginTransaction();

            try {
                const [result] = await ProductModel.create({
                    name, price, process_type, product_type, image: imagePath
                }, connection);

                const productId = result.insertId;

                if (process_type === "üretilen" && parsedRecipe && Array.isArray(parsedRecipe) && parsedRecipe.length > 0) {
                    for (const item of parsedRecipe) {
                        await ProductModel.addReceiptItem(connection, productId, item.ingredient_id, item.quantity);
                    }
                }

                if (process_type === "al-sat") {
                    await ProductModel.addProductStock(connection, {
                        product_id: productId,
                        stock: parseFloat(stock) || 0,
                        min_stock: parseFloat(min_stock) || 0,
                        wholesaler_id: wholesaler_id || null,
                        unit_price: parseFloat(unit_price) || 0,
                        min_purch: parseFloat(min_purch) || 0
                    });
                }

                await connection.commit();
                connection.release();

                res.json({ success: true, id: productId, message: "Ürün eklendi" });
            } catch (error) {
                await connection.rollback();
                connection.release();
                throw error;
            }
        } catch (error) {
            console.error("Add product error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async updateProduct(req, res) {
        try {
            const {
                name, price, recipe, process_type = "üretilen", product_type = 1,
                stock, min_stock, wholesaler_id, unit_price, min_purch,
            } = req.body;
            const { id } = req.params;

            if (!name || !price) {
                return res.status(400).json({ error: "Ürün adı ve fiyat gerekli" });
            }

            let parsedRecipe = null;
            if (recipe) {
                try {
                    parsedRecipe = typeof recipe === "string" ? JSON.parse(recipe) : recipe;
                } catch (e) {
                    parsedRecipe = null;
                }
            }

            let imagePath = undefined;
            if (req.file) {
                imagePath = `/uploads/product/${req.file.filename}`;
            } else if (req.body && req.body.remove_image === "1") {
                imagePath = "";
            }

            const connection = await ProductModel.getConnection();
            await connection.beginTransaction();

            try {
                const [result] = await ProductModel.update(id, {
                    name, price, process_type, product_type, image: imagePath
                }, connection);

                if (result.affectedRows === 0) {
                    await connection.rollback();
                    connection.release();
                    return res.status(404).json({ error: "Ürün bulunamadı" });
                }

                const [currentProduct] = await connection.execute("SELECT process_type FROM product WHERE id = ?", [id]);
                const oldProcessType = currentProduct[0]?.process_type;

                if (process_type === "üretilen") {
                    await ProductModel.deleteReceipt(connection, id);

                    if (parsedRecipe && Array.isArray(parsedRecipe) && parsedRecipe.length > 0) {
                        for (const item of parsedRecipe) {
                            await ProductModel.addReceiptItem(connection, id, item.ingredient_id, item.quantity);
                        }
                    }

                    if (oldProcessType === "al-sat") {
                        await ProductModel.deleteProductStock(connection, id);
                    }
                }

                if (process_type === "al-sat") {
                    const [existingStock] = await ProductModel.findProductStock(connection, id);

                    const stockData = {
                        product_id: id,
                        stock: parseFloat(stock) || 0,
                        min_stock: parseFloat(min_stock) || 0,
                        wholesaler_id: wholesaler_id || null,
                        unit_price: parseFloat(unit_price) || 0,
                        min_purch: parseFloat(min_purch) || 0
                    };

                    if (existingStock.length > 0) {
                        await ProductModel.updateProductStock(connection, stockData);
                    } else {
                        await ProductModel.addProductStock(connection, stockData);
                    }

                    if (oldProcessType === "üretilen") {
                        await ProductModel.deleteReceipt(connection, id);
                    }
                }

                await connection.commit();
                connection.release();

                res.json({ success: true, message: "Ürün güncellendi" });
            } catch (error) {
                await connection.rollback();
                connection.release();
                throw error;
            }
        } catch (error) {
            console.error("Update product error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async deleteProduct(req, res) {
        try {
            const [result] = await ProductModel.delete(req.params.id);
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Ürün bulunamadı" });
            }
            res.json({ success: true, message: "Ürün silindi" });
        } catch (error) {
            console.error("Delete product error:", error);
            // Business Rule: Check constraints logic
            if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(400).json({ error: "Bu ürün satış veya stok kayıtlarında kullanıldığı için silinemez." });
            }
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async getProductTypes(req, res) {
        try {
            const [rows] = await ProductModel.getTypes();
            res.json(rows);
        } catch (error) {
            console.error("Get product types error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }
}

module.exports = ProductController;
