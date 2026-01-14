const BaseModel = require('./BaseModel');

class SettingModel extends BaseModel {
    static async findAll() {
        return this.query("SELECT * FROM payroll_settings ORDER BY id");
    }

    static async getTypeMap() {
        const [rows] = await this.query("SELECT code, value_type FROM payroll_settings");
        const typeMap = {};
        rows.forEach(s => typeMap[s.code] = s.value_type);
        return typeMap;
    }

    static async updateValueString(code, value) {
        return this.query("UPDATE payroll_settings SET value_string = ? WHERE code = ?", [value, code]);
    }

    static async updateValue(code, value) {
        return this.query("UPDATE payroll_settings SET value = ? WHERE code = ?", [value, code]);
    }

    static async logHistory(code, value, type) {
        if (type === 'STRING') {
            return this.query(
                "INSERT INTO payroll_setting_history (code, value_string, effective_date) VALUES (?, ?, CURDATE())",
                [code, value]
            );
        } else {
            return this.query(
                "INSERT INTO payroll_setting_history (code, value, effective_date) VALUES (?, ?, CURDATE())",
                [code, value]
            );
        }
    }
}

module.exports = SettingModel;
