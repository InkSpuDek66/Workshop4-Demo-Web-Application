const port = 3000;
const host = 'localhost'; 
const API_URL = `http://${host}:${port}`;
console.log(API_URL);

document.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
        document.getElementById("loginSection").classList.add("d-none");
        document.getElementById("fileSection").classList.remove("d-none");
        document.getElementById("userDisplay").innerText = `สวัสดีคุณ ${user.username}`;
        loadFiles();
    }
});

let failedAttempts = 0;
let lockoutTimeout;

// ฟังก์ชันล็อกอิน
function login() {
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const login = document.getElementById("login");
    const cooldownLabel = document.getElementById("cooldownLabel");
    const cooldownTime = document.getElementById("cooldownTime");
    const username = usernameInput.value;
    const password = passwordInput.value;

    const validUsers = { "admin": "1234", "user1": "password1", "user2": "password2" };

    if (lockoutTimeout) {
        alert("คุณล็อกอินผิดพลาดเกิน 3 ครั้ง กรุณารอ 3 วินาทีแล้วลองใหม่อีกครั้ง");
        return;
    }

    if (validUsers[username] && validUsers[username] === password) {
        failedAttempts = 0; // Reset failed attempts on successful login
        const lastLogin = new Date().toLocaleString();
        localStorage.setItem("user", JSON.stringify({ username, lastLogin }));

        document.getElementById("loginSection").classList.add("d-none");
        document.getElementById("fileSection").classList.remove("d-none");
        document.getElementById("userDisplay").innerText = `สวัสดีคุณ ${username}!!`;
        loadFiles();
        alert(`เข้าสู่ระบบสำเร็จ! สวัสดีคุณ ${username}`);
        console.log("----------------------------");
        console.log("ชื่อผู้ใช้:", username);
        console.log("เวลาล่าสุดที่เข้าใช้:", lastLogin);
    } else {
        failedAttempts++;
        if (failedAttempts >= 3) {
            alert("คุณล็อกอินผิดพลาดเกิน 3 ครั้ง กรุณารอ 3 วินาทีแล้วลองใหม่อีกครั้ง");
            usernameInput.disabled = true;
            passwordInput.disabled = true;
            usernameInput.classList.add("cooldown");
            passwordInput.classList.add("cooldown");
            login.classList.add("cooldown");
            cooldownLabel.classList.remove("d-none");

            let remainingTime = 3;
            cooldownTime.textContent = remainingTime;

            lockoutTimeout = setInterval(() => {
                remainingTime--;
                cooldownTime.textContent = remainingTime;

                if (remainingTime <= 0) {
                    clearInterval(lockoutTimeout);
                    lockoutTimeout = null;
                    failedAttempts = 0;
                    usernameInput.disabled = false;
                    passwordInput.disabled = false;
                    usernameInput.classList.remove("cooldown");
                    passwordInput.classList.remove("cooldown");
                    login.classList.remove("cooldown");
                    cooldownLabel.classList.add("d-none");
                    location.reload(); // Refresh the page
                }
            }, 1000);
        } else {
            alert(`ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง! ครั้งที่ ${failedAttempts}`);
        }
    }
}

// ฟังก์ชันออกจากระบบ
function logout() {
    localStorage.removeItem("user");
    alert("ออกจากระบบเรียบร้อย!");
    location.reload();
}

async function uploadFile() {
    const fileInput = document.getElementById("fileInput");
    if (!fileInput.files.length) return alert("กรุณาเลือกไฟล์!");

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    const user = JSON.parse(localStorage.getItem("user"));
    formData.append("username", user.username); // Add username to formData

    try {
        const res = await fetch(`${API_URL}/upload`, { method: "POST", body: formData });
        const data = await res.json();
        alert(data.message);
        loadFiles();
    } catch (err) {
        console.error("Upload Error:", err);
    }
}

// ฟังก์ชันยกเลิกการอัปโหลดไฟล์
function cancelUpload() {
    const fileInput = document.getElementById("fileInput");
    fileInput.value = "";
    document.getElementById("preview").innerHTML = "";
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
            const isOwner = file.username === user.username;

            const li = document.createElement("li");
            li.className = "list-group-item d-flex justify-content-between align-items-center";
            li.innerHTML = `
                ${file.filename} ( อัปโหลดโดย : ${file.username})
                <div>
                    <button class="btn btn-primary btn-sm" onclick="handleDownloadCooldown(this, '${file.filename}')">ดาวน์โหลด</button>
                    ${isOwner ? `<button class="btn btn-danger btn-sm" onclick="deleteFile('${file.filename}')">ลบ</button>` : ''}
                </div>
            `;
            fileList.appendChild(li);
        });
    } catch (err) {
        console.error("Load Files Error:", err);
    }
}

// ฟังก์ชันคูลดาวน์หลังโหลดไฟล์
function handleDownloadCooldown(button, file) {
    let cooldown = 5;
    button.disabled = true; // ปิดใช้งานปุ่มทันที
    button.textContent = `รอ ${cooldown} วินาที...`;

    // เริ่มนับถอยหลังทันที
    const interval = setInterval(() => {
        cooldown--;
        if (cooldown > 0) {
            button.textContent = `รอ ${cooldown} วินาที...`;
        } else {
            clearInterval(interval);
            button.textContent = "ดาวน์โหลด";
            button.disabled = false; // เปิดใช้งานปุ่มอีกครั้ง
        }
    }, 1000);

    // เริ่มดาวน์โหลดไฟล์ทันทีที่กดปุ่ม
    window.location.href = `${API_URL}/download/${file}`;

    // แจ้งเตือนหลังจากสั่งดาวน์โหลด (ดีเลย์เล็กน้อยเพื่อให้แน่ใจว่าเริ่มดาวน์โหลดแล้ว)
    setTimeout(() => {
        alert("ดาวน์โหลดสำเร็จ!");
    }); 
}


// ฟังก์ชันลบไฟล์
async function deleteFile(filename) {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return alert("กรุณาเข้าสู่ระบบ!");

    try {
        const res = await fetch(`${API_URL}/files`);
        const files = await res.json();
        const file = files.find(f => f.filename === filename);

        if (file.username !== user.username) {
            return alert("คุณไม่มีสิทธิ์ลบไฟล์นี้!");
        }

        if (!confirm(`คุณต้องการลบไฟล์ ${filename} หรือไม่?`)) return;

        const deleteRes = await fetch(`${API_URL}/delete/${filename}`, {
            method: "DELETE",
            headers: { 
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username: user.username }) // ส่ง username ไปให้ Backend
        });

        const data = await deleteRes.json();
        if (deleteRes.ok) {
            alert(data.message);
            loadFiles();
        } else {
            alert(`ลบไฟล์ไม่สำเร็จ: ${data.message}`);
        }
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

        // เพิ่ม event listener สำหรับการคลิกที่ภาพ
        img.addEventListener("click", () => {
            const modal = document.createElement("div");
            modal.style.position = "fixed";
            modal.style.top = "0";
            modal.style.left = "0";
            modal.style.width = "100%";
            modal.style.height = "100%";
            modal.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
            modal.style.display = "flex";
            modal.style.justifyContent = "center";
            modal.style.alignItems = "center";
            modal.style.zIndex = "1000";

            const modalImg = document.createElement("img");
            modalImg.src = img.src;
            modalImg.style.maxWidth = "90%";
            modalImg.style.maxHeight = "90%";
            modalImg.style.boxShadow = "0 0 20px rgba(0, 0, 0, 0.5)";
            modal.appendChild(modalImg);

            modal.addEventListener("click", () => {
                document.body.removeChild(modal);
            });

            document.body.appendChild(modal);
        });
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
