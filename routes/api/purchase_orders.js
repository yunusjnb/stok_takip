const express = require("express");
const router = express.Router();
const PurchaseOrderController = require("../../controllers/purchaseOrderController");

// Tüm satın alma siparişlerini getir
router.get("/", PurchaseOrderController.getAllOrders);

// Düşük stoklu kalemler için otomatik satın alma siparişi oluştur
router.post("/auto-from-low-stock", PurchaseOrderController.createAutoOrders);

// Siparişi onayla ve stoklara işle
router.post("/:id/approve", PurchaseOrderController.approveOrder);

// Sipariş kalemlerini güncelle
router.put("/:id/items", PurchaseOrderController.updateItems);

// Tek sipariş + kalemlerini getir
router.get("/:id", PurchaseOrderController.getOrderById);

module.exports = router;
