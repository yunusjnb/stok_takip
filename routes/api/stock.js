const express = require("express");
const router = express.Router();
const StockController = require("../../controllers/stockController");

// Tüm malzemeleri getir
router.get("/ingredients", StockController.getAllIngredients);

// Tüm stokları getir
router.get("/all", StockController.getAllStock);

// Düşük stoklu malzemeler
router.get("/ingredients/low", StockController.getLowStock);

// Tek malzeme getir
router.get("/ingredients/:id", StockController.getIngredientById);

// Yeni malzeme ekle
router.post("/ingredients", StockController.createIngredient);

// Malzeme güncelle
router.put("/ingredients/:id", StockController.updateIngredient);

// Malzeme sil
router.delete("/ingredients/:id", StockController.deleteIngredient);

// Stok durumu istatistikleri
router.get("/stats", StockController.getStats);

// Stok Tüketim Analizi
router.get("/consumption", StockController.getConsumption);

// Stok Kategorileri Dağılımı
router.get("/categories", StockController.getCategoryValues);

// Detaylı Stok Raporu
router.get("/details", StockController.getDetails);

// Stok durumu günlük değişim yüzdesi
router.get("/daily-change", StockController.getDailyChange);

// Tedarikçileri getir
router.get("/wholesalers", StockController.getWholesalers);

// Tek ürün stok getir
router.get("/product-stock/:id", StockController.getProductStockById);

// Ürün stok güncelle
router.put("/product-stock/:id", StockController.updateProductStock);

// Ürün stok sil
router.delete("/product-stock/:id", StockController.deleteProductStock);

// Stok Geçmişi
router.get("/history", StockController.getHistory);

// Son 7 günlük sevkiyat durumu
router.get("/shipments-recent", StockController.getRecentShipments);

module.exports = router;
