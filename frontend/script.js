const port = 3000;
const host = 'localhost'; //192.168.5.23
const API_URL = `http://${host}:${port}`; // URL ของ Backend
console.log(API_URL);

// ตรวจสอบการล็อกอินเมื่อหน้าโหลด
document.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
        console.log(`สวัสดีคุณ ${user.username}!`);
        document.getElementById("loginSection").classList.add("d-none");
        document.getElementById("fileSection").classList.remove("d-none");
        loadFiles();
    }
});

// ฟังก์ชันล็อกอิน
function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    // Mock Data (ผู้ใช้ที่ถูกต้อง)
    const validUsers = { "admin": "1234", "user1": "password1", "user2": "password2" };

    if (validUsers[username] && validUsers[username] === password) {
        const lastLogin = new Date().toLocaleString();
        localStorage.setItem("user", JSON.stringify({ username, lastLogin }));

        document.getElementById("loginSection").classList.add("d-none");
        document.getElementById("fileSection").classList.remove("d-none");
        loadFiles();
        console.log("----------------------------");
        console.log("ชื่อผู้ใช้:", username);
        console.log("เวลาล่าสุดที่เข้าใช้:", lastLogin);
    } else {
        alert("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง!");
    }
}

// ฟังก์ชันออกจากระบบ
function logout() {
    localStorage.removeItem("user");
    alert("ออกจากระบบเรียบร้อย!");
    location.reload();
}

// ฟังก์ชันอัปโหลดไฟล์
async function uploadFile() {
    const fileInput = document.getElementById("fileInput");
    const user = JSON.parse(localStorage.getItem("user"));
    if (!fileInput.files.length) return alert("กรุณาเลือกไฟล์!");
    if (!user) return alert("กรุณาเข้าสู่ระบบ!");

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);
    formData.append("owner", user.username); // ส่งชื่อผู้ใช้ไปยังเซิร์ฟเวอร์

    try {
        const res = await fetch(`${API_URL}/upload`, { method: "POST", body: formData });
        const data = await res.json();
        alert(data.message);
        loadFiles();
    } catch (err) {
        console.error("Upload Error:", err);
    }
}

// ฟังก์ชันโหลดรายการไฟล์
async function loadFiles() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;

    try {
        const res = await fetch(`${API_URL}/files`);
        const files = await res.json();

        const fileList = document.getElementById("fileList");
        fileList.innerHTML = "";

        files.forEach(file => {
            const li = document.createElement("li");
            li.className = "list-group-item d-flex justify-content-between align-items-center";
            li.innerHTML = `
                ${file.name} (โดย ${file.owner})
                <div>
                    <a href="${API_URL}/download/${file.name}" class="btn btn-primary btn-sm">ดาวน์โหลด</a>
                    ${file.owner === user.username 
                        ? `<button class="btn btn-danger btn-sm ms-2" onclick="deleteFile('${file.name}')">ลบ</button>` 
                        : ''}
                </div>
            `;
            fileList.appendChild(li);
        });
    } catch (err) {
        console.error("Load Files Error:", err);
    }
}

// ฟังก์ชันลบไฟล์ (เฉพาะเจ้าของ)
async function deleteFile(filename) {
    if (!confirm(`คุณต้องการลบไฟล์ ${filename} หรือไม่?`)) return;
    
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return alert("กรุณาเข้าสู่ระบบ!");

    try {
        const res = await fetch(`${API_URL}/delete/${filename}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: user.username }) // ส่งชื่อผู้ใช้ไปตรวจสอบที่ Backend
        });
        const data = await res.json();
        alert(data.message);
        loadFiles();
    } catch (err) {
        console.error("Delete Error:", err);
    }
}

// ฟังก์ชันลบไฟล์
async function deleteFile(filename) {
    if (!confirm(`คุณต้องการลบไฟล์ ${filename} หรือไม่?`)) return;

    try {
        const res = await fetch(`${API_URL}/delete/${filename}`, { method: "DELETE" });
        const data = await res.json();
        alert(data.message);
        loadFiles();
    } catch (err) {
        console.error("Delete Error:", err);
    }
}

// ฟังก์ชันแสดงตัวอย่างไฟล์ก่อนอัปโหลด
document.getElementById("fileInput").addEventListener("change", () => {
    const fileInput = document.getElementById("fileInput");
    const preview = document.getElementById("preview");
    preview.innerHTML = "";

    const file = fileInput.files[0];
    if (!file) return;

    if (file.type.startsWith("image/")) {
        const img = document.createElement("img");
        img.src = URL.createObjectURL(file);
        img.style.maxWidth = "200px";
        img.className = "mt-2 img-thumbnail";
        preview.appendChild(img);
    } else if (["text/plain", "application/json", "text/csv"].includes(file.type)) {
        const reader = new FileReader();
        reader.onload = () => {
            const textPreview = document.createElement("pre");
            textPreview.textContent = reader.result.substring(0, 500);
            textPreview.className = "mt-2 border p-2 bg-light";
            preview.appendChild(textPreview);
        };
        reader.readAsText(file);
    } else {
        preview.innerHTML = `<p class="text-danger mt-2">ไม่สามารถแสดงตัวอย่างไฟล์นี้ได้</p>`;
    }
});