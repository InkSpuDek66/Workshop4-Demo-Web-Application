const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const port = 3000;
const uploadDir = "./uploads";

app.use(cors());
app.use(express.json());

// ตรวจสอบว่าโฟลเดอร์ uploads มีอยู่หรือไม่ ถ้าไม่มีให้สร้าง
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({ storage });

// เก็บข้อมูลไฟล์
let fileDB = [];

// อัปโหลดไฟล์
app.post("/upload", upload.single("file"), (req, res) => {
    const { owner } = req.body;
    if (!req.file || !owner) {
        return res.status(400).json({ message: "อัปโหลดไฟล์ล้มเหลว!" });
    }

    const newFile = { name: req.file.filename, owner };
    fileDB.push(newFile);
    res.json({ message: "อัปโหลดไฟล์สำเร็จ!" });
});

// รับรายการไฟล์
app.get("/files", (req, res) => {
    res.json(fileDB);
});

// ดาวน์โหลดไฟล์
app.get("/download/:filename", (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).json({ message: "ไม่พบไฟล์!" });
    }
});

// ลบไฟล์ (ตรวจสอบเจ้าของ)
app.delete("/delete/:filename", (req, res) => {
    const { filename } = req.params;
    const { username } = req.body;

    const fileIndex = fileDB.findIndex(file => file.name === filename);
    if (fileIndex === -1) return res.status(404).json({ message: "ไม่พบไฟล์!" });

    const file = fileDB[fileIndex];
    if (file.owner !== username) return res.status(403).json({ message: "คุณไม่มีสิทธิ์ลบไฟล์นี้!" });

    const filePath = path.join(uploadDir, filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    fileDB.splice(fileIndex, 1);
    res.json({ message: "ลบไฟล์สำเร็จ!" });
});

app.listen(port, () => console.log(`Server running on port ${port}`));
