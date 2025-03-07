const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const moment = require("moment");

const app = express();
const port = 3000;
const uploadDir = "./uploads";

app.use(cors());
app.use(express.json());

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, `[${moment().format("YYYY-MM-DD_HH-mm-ss")}]-${file.originalname}`);
  }
});

const upload = multer({ storage });

// อัปโหลดไฟล์
app.post("/upload", upload.single("file"), (req, res) => {
  const { username } = req.body;
  const fileData = {
    filename: req.file.filename,
    username: username
  };
  fs.writeFileSync(`uploads/${req.file.filename}.json`, JSON.stringify(fileData));
  res.json({ message: "Upload successful", filename: req.file.filename });
});

// ดึงรายการไฟล์
app.get("/files", (req, res) => {
  fs.readdir("uploads", (err, files) => {
    if (err) return res.status(500).json({ message: "Error retrieving files" });
    const fileList = files.filter(file => !file.endsWith('.json')).map(file => {
      const fileData = JSON.parse(fs.readFileSync(`uploads/${file}.json`));
      return fileData;
    });
    res.json(fileList);
  });
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
  const filePath = path.join("uploads", req.params.filename);
  const jsonFilePath = `${filePath}.json`;

  fs.unlink(filePath, (err) => {
    if (err) return res.status(500).json({ message: "Error deleting file" });

    fs.unlink(jsonFilePath, (err) => {
      if (err) return res.status(500).json({ message: "Error deleting file metadata" });
      res.json({ message: "File deleted" });
    });
  });
});


app.listen(port, () => console.log(`Server running on port ${port}`));
