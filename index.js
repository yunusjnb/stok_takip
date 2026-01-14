const express = require("express");
const path = require("path");
const logger = require("./middleware/logger");
require("dotenv").config();

const app = express();

// Body Parser (İstek Gövdesi) Ara Yazılımı
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logger Ara Yazılımı
app.use(logger);

// Statik klasör ayarlama
app.use(express.static(path.join(__dirname, "views")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Rotalar
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "login", "welcome.html"));
});

app.get("/login/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "login", "login.html"));
});

app.get("/welcome", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "login", "welcome.html"));
});

app.get("/login/cashier", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "login", "cashier_login.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "dashboard", "dashboard.html"));
});

// Kasa Rotaları
app.get("/cashier", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "cashier", "cart_and_sales.html"));
});

app.get("/cashier/cart", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "cashier", "cart_and_sales.html"));
});

// Personel Rotaları
app.get("/employe/add", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "employe", "add_employe.html"));
});

app.get("/employe/track", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "employe", "track_employe.html"));
});

app.get("/employe/update", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "employe", "update_employe.html"));
});

// Ürün Rotaları
app.get("/product/add", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "product", "add_product.html"));
});

app.get("/product/track", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "product", "track_product.html"));
});

app.get("/product/update", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "product", "update_product.html"));
});

// Stok Rotası
app.get("/stock", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "stock", "stock.html"));
});

app.get("/stock/ingredient/add", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "stock", "ingredient_add.html"));
});

app.get("/stock/ingredient/update", (req, res) => {
  res.sendFile(
    path.join(__dirname, "views", "stock", "ingredient_update.html")
  );
});

app.get("/stock/product-stock/update", (req, res) => {
  res.sendFile(
    path.join(__dirname, "views", "stock", "product_stock_update.html")
  );
});

// Satış Rotası
app.get("/sales", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "sales", "sales_analyz.html"));
});

// Rapor Rotası
app.get("/reports", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "reports", "reports.html"));
});

app.get("/reports/general", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "reports", "report_general.html"));
});

app.get("/reports/sales", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "reports", "report_sales.html"));
});

app.get("/reports/stock", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "reports", "report_stock.html"));
});

app.get("/reports/employe", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "reports", "report_employe.html"));
});

app.get("/reports/close", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "reports", "report_close.html"));
});

// Maaş Rotası
app.get("/salary", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "salary", "salary.html"));
});

// Tedarikçi Rotası
app.get("/supplier/track", (req, res) => {
  res.sendFile(
    path.join(__dirname, "views", "supplier", "supplier_track.html")
  );
});

// Sevkiyat Rotası
app.get("/supplier/supply", (req, res) => {
  res.sendFile(
    path.join(__dirname, "views", "supplier", "supply_cart.html")
  );
});

// Gider Rotası
app.get("/expense/add", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "expense", "expense_add.html"));
});

// Ayarlar Rotası
app.get("/settings", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "settings", "settings.html"));
});

// API Rotaları
app.use("/api/auth", require("./routes/api/auth"));
app.use("/api/employees", require("./routes/api/employees"));
app.use("/api/products", require("./routes/api/products"));
app.use("/api/stock", require("./routes/api/stock"));
app.use("/api/sales", require("./routes/api/sales"));
app.use("/api/salary", require("./routes/api/salary"));
app.use("/api/wholesalers", require("./routes/api/wholesalers"));
app.use("/api/expenses", require("./routes/api/expenses"));
app.use("/api/reports", require("./routes/api/reports"));
app.use("/api/purchase-orders", require("./routes/api/purchase_orders"));
app.use("/api/settings", require("./routes/api/settings"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
