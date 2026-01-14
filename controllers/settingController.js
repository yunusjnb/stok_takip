const SettingModel = require('../models/SettingModel');

class SettingController {
    static async getAll(req, res) {
        try {
            const [rows] = await SettingModel.findAll();
            const settings = {};
            rows.forEach(row => {
                settings[row.code] = {
                    id: row.id,
                    name: row.name,
                    value: parseFloat(row.value),
                    value_string: row.value_string,
                    value_type: row.value_type,
                    description: row.description
                };
            });
            res.json(settings);
        } catch (error) {
            console.error("Get settings error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async update(req, res) {
        try {
            const updates = req.body;
            const keys = Object.keys(updates);

            const typeMap = await SettingModel.getTypeMap();

            for (const key of keys) {
                if (typeMap[key]) {
                    const val = updates[key];
                    const type = typeMap[key];

                    if (type === 'STRING') {
                        await SettingModel.updateValueString(key, val);
                        await SettingModel.logHistory(key, val, type);
                    } else {
                        const numVal = parseFloat(val);
                        await SettingModel.updateValue(key, numVal);
                        await SettingModel.logHistory(key, numVal, type);
                    }
                }
            }

            res.json({ success: true, message: "Ayarlar güncellendi" });

        } catch (error) {
            console.error("Update settings error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }
}

module.exports = SettingController;
