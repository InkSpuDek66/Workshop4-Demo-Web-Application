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

let failedAttempts = 0;
let lockoutTimeout;

// ฟังก์ชันล็อกอิน
function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    // Mock Data (ผู้ใช้ที่ถูกต้อง)
    const validUsers = { "admin": "1234", "user1": "password1", "user2": "password2" };

    if (lockoutTimeout) {
        const lockoutModal = new bootstrap.Modal(document.getElementById('lockoutModal'));
        lockoutModal.show();
        return;
    }

    if (validUsers[username] && validUsers[username] === password) {
        failedAttempts = 0; // Reset failed attempts on successful login
        const lastLogin = new Date().toLocaleString();
        localStorage.setItem("user", JSON.stringify({ username, lastLogin }));
        document.getElementById("loginSection").classList.add("d-none");
        document.getElementById("fileSection").classList.remove("d-none");
        loadFiles();
        alert(`เข้าสู่ระบบสำเร็จ! สวัสดีคุณ ${username}`);
        console.log("----------------------------");
        console.log("ชื่อผู้ใช้:", username);
        console.log("เวลาล่าสุดที่เข้าใช้:", lastLogin);
    } else {
        failedAttempts++;
        if (failedAttempts >= 3) {
            countFailedLogin();
        } else {
            alert(`ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง!ครั้งที่:${failedAttempts}`);
        }
    }
}

function countFailedLogin() {
    const loginButton = document.querySelector("button[onclick='login()']");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const loginAgainLabel = document.getElementById("loginAgainLabel");
    const countdown = document.getElementById("countdown");

    loginButton.disabled = true;
    loginButton.classList.add("btn-secondary");
    loginButton.classList.remove("btn-primary");

    usernameInput.disabled = true;
    passwordInput.disabled = true;
    usernameInput.classList.add("bg-secondary");
    passwordInput.classList.add("bg-secondary");

    loginAgainLabel.classList.remove("d-none");

    let timeLeft = 3;
    countdown.textContent = timeLeft;

    const countdownInterval = setInterval(() => {
        timeLeft--;
        countdown.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            loginAgainLabel.classList.add("d-none");
        }
    }, 1000);

    alert("คุณล็อกอินผิดพลาดเกิน 3 ครั้ง กรุณารอ 3 วินาทีแล้วลองใหม่อีกครั้ง");

    lockoutTimeout = setTimeout(() => {
        failedAttempts = 0;
        lockoutTimeout = null;

        loginButton.disabled = false;
        loginButton.classList.remove("btn-secondary");
        loginButton.classList.add("btn-primary");

        usernameInput.disabled = false;
        passwordInput.disabled = false;
        usernameInput.classList.remove("bg-secondary");
        passwordInput.classList.remove("bg-secondary");

        location.reload(); // Refresh the page
    }, 3000);
}

// Event listener for modal OK button
document.getElementById("modalOkButton").addEventListener("click", () => {
    const lockoutModal = bootstrap.Modal.getInstance(document.getElementById('lockoutModal'));
    lockoutModal.hide();
    location.reload(); // Refresh the page
});

// ฟังก์ชันออกจากระบบ
function logout() {
    localStorage.removeItem("user");
    alert("ออกจากระบบเรียบร้อย!");
    location.reload();
}

// ฟังก์ชันอัปโหลดไฟล์
async function uploadFile() {
    const fileInput = document.getElementById("fileInput");
    if (!fileInput.files.length) return alert("กรุณาเลือกไฟล์!");

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

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
    try {
        const res = await fetch(`${API_URL}/files`);
        const files = await res.json();

        const fileList = document.getElementById("fileList");
        fileList.innerHTML = "";

        files.forEach(file => {
            const li = document.createElement("li");
            li.className = "list-group-item d-flex justify-content-between align-items-center";
            li.innerHTML = `
                ${file}
                <div>
                    <a href="${API_URL}/download/${file}" class="btn btn-primary btn-sm">ดาวน์โหลด</a>
                    <button class="btn btn-danger btn-sm" onclick="deleteFile('${file}')">ลบ</button>
                </div>
            `;
            fileList.appendChild(li);
        });
    } catch (err) {
        console.error("Load Files Error:", err);
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
    if (!file) return; //หยุดการทำงานของฟังก์ชัน

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