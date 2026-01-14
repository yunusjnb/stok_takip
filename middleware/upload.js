const multer = require("multer");
const path = require("path");
const fs = require("fs");

// uploads/product klasörünü oluştur (yoksa)
const uploadDir = path.join(__dirname, "..", "uploads", "product");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer depolama yapılandırması
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Dosya adını ürün adından oluştur (Türkçe karakterleri temizle)
    const productName = req.body.name || "product";
    const sanitizedName = productName
      .toLowerCase()
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ı/g, "i")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    
    // Orijinal dosya uzantısını al
    const ext = path.extname(file.originalname);
    const filename = `${sanitizedName}${ext}`;
    cb(null, filename);
  }
});

// Dosya filtresi (sadece resimler)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Sadece resim dosyaları yüklenebilir (JPG, PNG, GIF, WEBP)"));
  }
};

// Multer ara yazılımı
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: fileFilter
});

module.exports = upload;

