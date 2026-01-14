const express = require("express");
const router = express.Router();
const WholesalerController = require("../../controllers/wholesalerController");

// Tüm tedarikçileri getir
router.get("/", WholesalerController.getAllWholesalers);

// Tek tedarikçi getir
router.get("/:id", WholesalerController.getWholesalerById);

// Yeni tedarikçi ekle
router.post("/", WholesalerController.createWholesaler);

// Tedarikçi güncelle
router.put("/:id", WholesalerController.updateWholesaler);

// Tedarikçi sil
router.delete("/:id", WholesalerController.deleteWholesaler);

module.exports = router;
