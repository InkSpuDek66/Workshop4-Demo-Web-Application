const port = 3000;
const host = 'localhost'; 
const API_URL = `http://${host}:${port}`;
console.log(API_URL);

document.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
        document.getElementById("loginSection").classList.add("d-none");
        document.getElementById("fileSection").classList.remove("d-none");
        loadFiles();
    }
});

function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const validUsers = { "admin": "1234", "user1": "password1", "user2": "password2" };

    if (validUsers[username] && validUsers[username] === password) {
        localStorage.setItem("user", JSON.stringify({ username }));
        document.getElementById("loginSection").classList.add("d-none");
        document.getElementById("fileSection").classList.remove("d-none");
        loadFiles();
    } else {
        alert("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง!");
    }
}

function logout() {
    localStorage.removeItem("user");
    alert("ออกจากระบบเรียบร้อย!");
    location.reload();
}

async function uploadFile() {
    const fileInput = document.getElementById("fileInput");
    const user = JSON.parse(localStorage.getItem("user"));
    if (!fileInput.files.length) return alert("กรุณาเลือกไฟล์!");
    if (!user) return alert("กรุณาเข้าสู่ระบบ!");

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);
    formData.append("owner", user.username);

    try {
        const res = await fetch(`${API_URL}/upload`, { method: "POST", body: formData });
        const data = await res.json();
        alert(data.message);
        loadFiles();
    } catch (err) {
        console.error("Upload Error:", err);
    }
}

async function loadFiles() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;

    try {
        const res = await fetch(`${API_URL}/files`);
        const files = await res.json();

        const fileList = document.getElementById("fileList");
        fileList.innerHTML = "";

        files.forEach(file => {
            const isOwner = file.owner === user.username;
            const isAdmin = user.username === "admin";
            const isUser1 = user.username === "user1";
            const isFileByAdmin = file.owner === "admin";

            const canDelete = isOwner || (isUser1 && !isFileByAdmin) || isAdmin;

            const li = document.createElement("li");
            li.className = "list-group-item d-flex justify-content-between align-items-center";
            li.innerHTML = `
                ${file.name} (โดย ${file.owner})
                <div>
                    <a href="${API_URL}/download/${file.name}" class="btn btn-primary btn-sm">ดาวน์โหลด</a>
                    <button class="btn btn-danger btn-sm ms-2" onclick="deleteFile('${file.name}')" ${canDelete ? "" : "disabled"}>ลบ</button>
                </div>
            `;
            fileList.appendChild(li);
        });
    } catch (err) {
        console.error("Load Files Error:", err);
    }
}

async function deleteFile(filename) {
    if (!confirm(`คุณต้องการลบไฟล์ ${filename} หรือไม่?`)) return;

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return alert("กรุณาเข้าสู่ระบบ!");

    try {
        const res = await fetch(`${API_URL}/delete/${filename}`, {
            method: "DELETE",
            headers: { 
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username: user.username }) // ส่ง username ไปให้ Backend
        });

        const data = await res.json();
        if (res.ok) {
            alert(data.message);
            loadFiles();
        } else {
            alert(`ลบไฟล์ไม่สำเร็จ: ${data.message}`);
        }
    } catch (err) {
        console.error("Delete Error:", err);
    }
}

