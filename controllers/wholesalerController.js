const WholesalerModel = require('../models/WholesalerModel');

class WholesalerController {
    static async getAllWholesalers(req, res) {
        try {
            const [rows] = await WholesalerModel.findAll();
            res.json(rows);
        } catch (error) {
            console.error("Get wholesalers error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async getWholesalerById(req, res) {
        try {
            const [rows] = await WholesalerModel.findById(req.params.id);
            if (rows.length === 0) {
                return res.status(404).json({ error: "Tedarikçi bulunamadı" });
            }
            res.json(rows[0]);
        } catch (error) {
            console.error("Get wholesaler error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async createWholesaler(req, res) {
        try {
            const { name, phone, address, active } = req.body;
            if (!name) {
                return res.status(400).json({ error: "Tedarikçi adı gerekli" });
            }
            const [result] = await WholesalerModel.create({ name, phone, address, active });
            res.json({ success: true, id: result.insertId, message: "Tedarikçi başarıyla eklendi" });
        } catch (error) {
            console.error("Add wholesaler error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async updateWholesaler(req, res) {
        try {
            const { id } = req.params;
            const { name, phone, address, active } = req.body;
            if (!name) {
                return res.status(400).json({ error: "Tedarikçi adı gerekli" });
            }
            await WholesalerModel.update(id, { name, phone, address, active });
            res.json({ success: true, message: "Tedarikçi başarıyla güncellendi" });
        } catch (error) {
            console.error("Update wholesaler error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async deleteWholesaler(req, res) {
        try {
            const { id } = req.params;
            const isUsed = await WholesalerModel.checkUsage(id);
            if (isUsed) {
                return res.status(400).json({
                    error: "Bu tedarikçi kullanılıyor, silinemez. Önce ilgili malzeme ve ürün stoklarını güncelleyin."
                });
            }
            await WholesalerModel.delete(id);
            res.json({ success: true, message: "Tedarikçi başarıyla silindi" });
        } catch (error) {
            console.error("Delete wholesaler error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }
}

module.exports = WholesalerController;
