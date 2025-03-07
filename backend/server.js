const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const port = 3000;
const host = 'localhost'; //  ใช้ 'localhost' หรือใช้ '0.0.0.0' หากต้องการเชื่อมต่อจากทุกที่

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("uploads"));

// ตั้งค่าการอัปโหลดไฟล์
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, '[' + Date.now() + '] - ' + file.originalname);
  }
});
const upload = multer({ storage });

// อัปโหลดไฟล์
app.post("/upload", upload.single("file"), (req, res) => {
  res.json({ message: "Upload successful", filename: req.file.filename });
});

// ดึงรายการไฟล์
app.get("/files", (req, res) => {
  fs.readdir("uploads", (err, files) => {
    if (err) return res.status(500).json({ message: "Error retrieving files" });
    res.json(files);
  });
});

// ดาวน์โหลดไฟล์
app.get("/download/:filename", (req, res) => {
  const filePath = path.join(__dirname, "uploads", req.params.filename);
  res.download(filePath);
});

// ลบไฟล์
app.delete("/delete/:filename", (req, res) => {
  const filePath = path.join("uploads", req.params.filename);
  fs.unlink(filePath, (err) => {
    if (err) return res.status(500).json({ message: "Error deleting file" });
    res.json({ message: "File deleted" });
  });
});

app.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
})