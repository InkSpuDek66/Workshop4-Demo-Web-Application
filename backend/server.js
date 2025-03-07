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

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({ storage });

let fileDB = [];

app.post("/upload", upload.single("file"), (req, res) => {
    const { owner } = req.body;
    if (!req.file || !owner) {
        return res.status(400).json({ message: "อัปโหลดไฟล์ล้มเหลว!" });
    }

    const newFile = { name: req.file.filename, owner };
    fileDB.push(newFile);
    res.json({ message: "อัปโหลดไฟล์สำเร็จ!" });
});

app.get("/files", (req, res) => {
    res.json(fileDB);
});

app.get("/download/:filename", (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).json({ message: "ไม่พบไฟล์!" });
    }
});

app.delete("/delete/:filename", (req, res) => {
  const { filename } = req.params;
  const { username } = req.body;  // ดึงค่า username ที่ส่งมาจาก frontend

  if (!username) {
      return res.status(400).json({ message: "ไม่ได้ระบุชื่อผู้ใช้!" });
  }

  const fileIndex = fileDB.findIndex(file => file.name === filename);
  if (fileIndex === -1) {
      return res.status(404).json({ message: "ไม่พบไฟล์!" });
  }

  const file = fileDB[fileIndex];

  // ตรวจสอบสิทธิ์การลบไฟล์
  const isAdmin = username === "admin";
  const isUser1 = username === "user1";
  const isOwner = file.owner === username;
  const isFileByAdmin = file.owner === "admin";

  if (!(isOwner || (isUser1 && !isFileByAdmin) || isAdmin)) {
      return res.status(403).json({ message: "คุณไม่มีสิทธิ์ลบไฟล์นี้!" });
  }

  // ลบไฟล์ออกจากระบบ
  const filePath = path.join(uploadDir, filename);
  if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
  }

  fileDB.splice(fileIndex, 1);
  res.json({ message: "ลบไฟล์สำเร็จ!" });
});


app.listen(port, () => console.log(`Server running on port ${port}`));
