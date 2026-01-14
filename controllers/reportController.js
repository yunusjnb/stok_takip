const ReportModel = require('../models/ReportModel');

class ReportController {

    static async getMonthlyClose(req, res) {
        try {
            const { year, month } = req.query;
            if (!year || !month) return res.status(400).json({ error: "Yıl ve ay gerekli" });

            const targetYear = parseInt(year);
            const targetMonth = parseInt(month);

            // Previous dates
            const prevMonth = targetMonth === 1 ? 12 : targetMonth - 1;
            const prevYear = targetMonth === 1 ? targetYear - 1 : targetYear;

            // Current Data
            const [currentIncome] = await ReportModel.getMonthlyIncome(targetYear, targetMonth);
            const [currentExpenses] = await ReportModel.getMonthlyExpenses(targetYear, targetMonth);
            const [currentPoExpenses] = await ReportModel.getMonthlyPoExpenses(targetYear, targetMonth);

            // Previous Data
            const [previousIncome] = await ReportModel.getMonthlyIncome(prevYear, prevMonth);
            const [previousExpenses] = await ReportModel.getMonthlyExpenses(prevYear, prevMonth);
            const [prevPoExpenses] = await ReportModel.getMonthlyPoExpenses(prevYear, prevMonth);

            const totalIncome = parseFloat(currentIncome[0]?.total_income || 0);
            const expenseTableTotal = parseFloat(currentExpenses[0]?.total_expenses || 0);
            const poTotal = parseFloat(currentPoExpenses[0]?.total_po || 0);
            const totalExpenses = expenseTableTotal + poTotal;
            const netProfit = totalIncome - totalExpenses;

            const prevTotalIncome = parseFloat(previousIncome[0]?.total_income || 0);
            const prevExpenseTableTotal = parseFloat(previousExpenses[0]?.total_expenses || 0);
            const prevPoTotal = parseFloat(prevPoExpenses[0]?.total_po || 0);
            const prevTotalExpenses = prevExpenseTableTotal + prevPoTotal;

            const incomeChangePercent = prevTotalIncome > 0 ? ((totalIncome - prevTotalIncome) / prevTotalIncome) * 100 : (totalIncome > 0 ? 100 : 0);
            const expenseChangePercent = prevTotalExpenses > 0 ? ((totalExpenses - prevTotalExpenses) / prevTotalExpenses) * 100 : (totalExpenses > 0 ? 100 : 0);

            res.json({
                totalIncome: totalIncome.toFixed(2),
                totalExpenses: totalExpenses.toFixed(2),
                netProfit: netProfit.toFixed(2),
                incomeChangePercent: parseFloat(incomeChangePercent.toFixed(2)),
                expenseChangePercent: parseFloat(expenseChangePercent.toFixed(2)),
                isIncomeIncrease: incomeChangePercent > 0,
                isExpenseIncrease: expenseChangePercent > 0
            });

        } catch (error) {
            console.error("Get monthly close error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async getDailyFlow(req, res) {
        try {
            const { year, month } = req.query;
            if (!year || !month) return res.status(400).json({ error: "Yıl ve ay gerekli" });

            const targetYear = parseInt(year);
            const targetMonth = parseInt(month);

            const [dailyIncome] = await ReportModel.getDailyIncome(targetYear, targetMonth);
            const [dailyExpenses] = await ReportModel.getDailyExpenses(targetYear, targetMonth);
            const [dailyPoExpenses] = await ReportModel.getDailyPoExpenses(targetYear, targetMonth);

            const dateMap = new Map();

            dailyIncome.forEach(item => {
                dateMap.set(item.date.toISOString().split('T')[0], {
                    date: item.date.toISOString().split('T')[0],
                    income: parseFloat(item.income),
                    expenses: 0
                });
            });

            dailyExpenses.forEach(item => {
                const dateKey = item.date.toISOString().split('T')[0];
                if (dateMap.has(dateKey)) {
                    dateMap.get(dateKey).expenses = parseFloat(item.expenses);
                } else {
                    dateMap.set(dateKey, { date: dateKey, income: 0, expenses: parseFloat(item.expenses) });
                }
            });

            dailyPoExpenses.forEach(item => {
                const dateKey = item.date.toISOString().split('T')[0];
                if (dateMap.has(dateKey)) {
                    dateMap.get(dateKey).expenses += parseFloat(item.expenses);
                } else {
                    dateMap.set(dateKey, { date: dateKey, income: 0, expenses: parseFloat(item.expenses) });
                }
            });

            const result = Array.from(dateMap.values()).sort((a, b) => new Date(a.date) - new Date(b.date));
            res.json(result);
        } catch (error) {
            console.error("Get daily flow error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async getExpenseBreakdown(req, res) {
        try {
            const { year, month } = req.query;
            if (!year || !month) return res.status(400).json({ error: "Yıl ve ay gerekli" });

            const targetYear = parseInt(year);
            const targetMonth = parseInt(month);

            const [breakdown] = await ReportModel.getExpenseBreakdown(targetYear, targetMonth);
            const [poExpenses] = await ReportModel.getMonthlyPoExpenses(targetYear, targetMonth);

            const poTotal = parseFloat(poExpenses[0]?.total_po || 0);
            if (poTotal > 0) {
                breakdown.push({
                    id: 'po_expense',
                    type_name: 'Tedarik Ödemeleri (Sevkiyat)',
                    total: poTotal
                });
                breakdown.sort((a, b) => parseFloat(b.total) - parseFloat(a.total));
            }

            const total = breakdown.reduce((sum, item) => sum + parseFloat(item.total), 0);

            const result = breakdown.map(item => ({
                id: item.id,
                type_name: item.type_name,
                total: parseFloat(item.total).toFixed(2),
                percentage: total > 0 ? ((parseFloat(item.total) / total) * 100).toFixed(1) : 0
            }));

            res.json(result);
        } catch (error) {
            console.error("Get expense breakdown error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async getExpenseDetails(req, res) {
        try {
            const { year, month, search, page = 1, limit = 10 } = req.query;
            if (!year || !month) return res.status(400).json({ error: "Yıl ve ay gerekli" });

            const targetYear = parseInt(year);
            const targetMonth = parseInt(month);
            const parsedLimit = parseInt(limit);
            const parsedPage = parseInt(page);
            const offset = (parsedPage - 1) * parsedLimit;

            const [expenseRows] = await ReportModel.getExpenseDetails(targetYear, targetMonth, search);
            const [poRows] = await ReportModel.getPoDetails(targetYear, targetMonth, search);

            // Merge PO contents if any
            if (poRows.length > 0) {
                const poIds = poRows.map(r => r.id);
                const [poItems] = await ReportModel.getPoItems(poIds);

                const itemsMap = {};
                poItems.forEach(item => {
                    if (!itemsMap[item.purchase_order_id]) itemsMap[item.purchase_order_id] = [];
                    itemsMap[item.purchase_order_id].push(`${item.item_name} (${item.quantity} ${item.unit})`);
                });

                poRows.forEach(row => {
                    const items = itemsMap[row.id];
                    row.description = (items && items.length > 0) ? items.join(', ') : "İçerik bilgisi yok";
                });
            }

            const allRows = [...expenseRows, ...poRows];
            allRows.sort((a, b) => new Date(b.date) - new Date(a.date));

            const totalCount = allRows.length;
            const paginatedRows = allRows.slice(offset, offset + parsedLimit);

            res.json({
                expenses: paginatedRows,
                total: totalCount,
                page: parsedPage,
                limit: parsedLimit,
                totalPages: Math.ceil(totalCount / parsedLimit)
            });
        } catch (error) {
            console.error("Get expense details error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async getAvailableMonths(req, res) {
        try {
            const [months] = await ReportModel.getAvailableMonths();
            const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

            const result = months.map(item => ({
                year: item.year,
                month: item.month,
                monthName: monthNames[item.month - 1],
                display: `${monthNames[item.month - 1]} ${item.year}`
            }));

            res.json(result);
        } catch (error) {
            console.error("Get available months error:", error);
            res.status(500).json({ error: "Sunucu hatası" });
        }
    }

    static async exportExcel(req, res) {
        try {
            const { year, month } = req.query;
            if (!year || !month) return res.status(400).send("Yıl ve ay gerekli");

            const targetYear = parseInt(year);
            const targetMonth = parseInt(month);

            // Summary Data
            const [currentIncome] = await ReportModel.getMonthlyIncome(targetYear, targetMonth);
            const [currentExpenses] = await ReportModel.getMonthlyExpenses(targetYear, targetMonth);
            const [currentPoExpenses] = await ReportModel.getMonthlyPoExpenses(targetYear, targetMonth);

            const totalIncome = parseFloat(currentIncome[0]?.total_income || 0);
            const expenseTableTotal = parseFloat(currentExpenses[0]?.total_expenses || 0);
            const poTotal = parseFloat(currentPoExpenses[0]?.total_po || 0);
            const totalExpenses = expenseTableTotal + poTotal;
            const netProfit = totalIncome - totalExpenses;

            // Detail Data
            const [expenseRows] = await ReportModel.getExpenseRowsForExport(targetYear, targetMonth);
            const [poRows] = await ReportModel.getPoRowsForExport(targetYear, targetMonth);

            let csvContent = "\uFEFF";
            csvContent += `KEŞİŞ KAFE AYLIK MUHASEBE RAPORU - ${month}/${year}\n\n`;

            csvContent += "FİNANSAL ÖZET\n";
            csvContent += "Kalem;Tutar\n";
            csvContent += `Toplam Gelir (Satışlar);${totalIncome.toFixed(2).replace('.', ',')}\n`;
            csvContent += `Toplam Gider (İşletme);${expenseTableTotal.toFixed(2).replace('.', ',')}\n`;
            csvContent += `Toplam Gider (Tedarik);${poTotal.toFixed(2).replace('.', ',')}\n`;
            csvContent += `TOPLAM GİDER;${totalExpenses.toFixed(2).replace('.', ',')}\n`;
            csvContent += `NET KAR/ZARAR;${netProfit.toFixed(2).replace('.', ',')}\n\n`;

            csvContent += "DETAYLI GİDER LİSTESİ\n";
            csvContent += "Tarih;Açıklama;Kategori;Tutar\n";

            expenseRows.forEach(row => {
                const date = new Date(row.date).toLocaleDateString("tr-TR");
                const price = parseFloat(row.price).toFixed(2).replace('.', ',');
                const desc = `"${(row.description || '').replace(/"/g, '""')}"`;
                csvContent += `${date};${row.name} ${desc !== '""' ? '- ' + desc : ''};${row.type_name};${price}\n`;
            });

            poRows.forEach(row => {
                const date = new Date(row.date).toLocaleDateString("tr-TR");
                const price = parseFloat(row.price).toFixed(2).replace('.', ',');
                csvContent += `${date};${row.supplier_name} - Sipariş #${row.id};Tedarik Ödemesi;${price}\n`;
            });

            csvContent += `\nTOPLAM GİDER; ; ;${totalExpenses.toFixed(2).replace('.', ',')}\n`;

            res.setHeader("Content-Type", "text/csv; charset=utf-8");
            res.setHeader("Content-Disposition", `attachment; filename=Rapor_${month}-${year}.csv`);
            res.send(csvContent);
        } catch (error) {
            console.error("Export excel error:", error);
            res.status(500).send("Sunucu hatası");
        }
    }

}

module.exports = ReportController;
