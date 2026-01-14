const express = require("express");
const router = express.Router();
const upload = require("../../middleware/upload");
const ProductController = require("../../controllers/productController");

// Tüm ürünleri getir
router.get("/", ProductController.getAllProducts);

// Ürün tipleri listesi
router.get("/types/list", ProductController.getProductTypes);

// Tek ürün getir
router.get("/:id", ProductController.getProductById);

// Ürün reçetesini getir
router.get("/:id/recipe", ProductController.getProductRecipe);

// Yeni ürün ekle
router.post("/", upload.single("image"), ProductController.createProduct);

// Ürün güncelle
router.put("/:id", upload.single("image"), ProductController.updateProduct);

// Ürün sil
router.delete("/:id", ProductController.deleteProduct);

module.exports = router;
