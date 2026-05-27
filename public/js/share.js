let allFiles = [];
let sortOrder = 'asc';
let showMyFilesOnly = false;

// Adds a file card
function addCard(file) {
    const fileList = document.getElementById("file-list");
    const card = document.createElement("div");

    card.classList.add("file-card");
    card.dataset.id = file.id;
    card.innerHTML = `
        <p>${file.owner}</p>
        <a target=" " class="file-link" href="/upload/${file.id}">${file.filename}</a>
    `;

    if (file.ownedByCurrentUser) {
        card.innerHTML += `
            <button class="rename-btn">✏️</button>
            <button class="delete-btn">🗑️</button>
        `;
    }

    fileList.appendChild(card);
    addRenameHandler(card, file);
    addDeleteHandler(card);
}

// Rename button functionality
function addRenameHandler(card, file) {
    const renameBtn = card.querySelector(".rename-btn");
    if (!renameBtn) return;

    renameBtn.addEventListener("click", async () => {
        const newName = prompt("Enter new filename:", file.filename);
        if (!newName) return;

        const res = await fetch(`/files/${file.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filename: newName })
        });

        const data = await res.json();
        if (res.ok) {
            confirm("Rename successful", true);
            file.filename = newName;
            card.querySelector(".file-link").textContent = data.filename;
        } else {
            confirm("Rename failed", false);
            console.log(data.error);
        }
    });
}

// Delete button functionality
function addDeleteHandler(card) {
    const deleteBtn = card.querySelector(".delete-btn");
    if (!deleteBtn) return;

    deleteBtn.addEventListener("click", async () => {
        const fileId = card.dataset.id;
        const res = await fetch(`/files/${fileId}`, { method: "DELETE" });
        const data = await res.json();
        if (res.ok) {
            confirm("Delete successful", true);
            allFiles = allFiles.filter(f => String(f.id) !== fileId);
            card.remove();
        } else {
            confirm("Delete failed", false);
            console.log(data.error);
        }
    });
}

// Displays files on page load
async function loadFiles() {
    const res = await fetch('/files');
    allFiles = await res.json();
    allFiles.forEach(file => addCard(file));
    renderFiles();
}

loadFiles();

// Sorting logic
function getFilteredSortedFiles() {
    const filtered = showMyFilesOnly ? allFiles.filter(f => f.ownedByCurrentUser) : allFiles;
    return [...filtered].sort((a, b) => {
        const cmp = a.filename.localeCompare(b.filename, undefined, { sensitivity: 'base' });
        return sortOrder === 'asc' ? cmp : -cmp;
    });
}

// Renders the listed files
function renderFiles() {
    const fileList = document.getElementById("file-list");
    fileList.innerHTML = "";
    getFilteredSortedFiles().forEach(file => addCard(file));
}

// Sort button functionality
document.getElementById("sortBtn").addEventListener("click", () => {
    sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    document.getElementById("sortBtn").textContent = sortOrder === 'asc' ? 'A → Z' : 'Z → A';
    renderFiles();
});

// Filter button functionality
document.getElementById("filterBtn").addEventListener("click", () => {
    showMyFilesOnly = !showMyFilesOnly;
    document.getElementById("filterBtn").textContent = showMyFilesOnly ? 'All Files' : 'My Files';
    renderFiles();
});

// Logout button functionality
document.getElementById("logout").onclick = async function () {
    await fetch('/logout', { method: 'POST' });
    window.location.href = '../index.html';
};

// Upload button functionality
document.getElementById("uploadBtn").addEventListener("click", async () => {
    const fileInput = document.getElementById("fileInput");

    if (fileInput.files.length === 0) {
        confirm("File not selected", false);
        return;
    }

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    const res = await fetch("/upload", {
        method: "POST",
        body: formData
    });

    const data = await res.json();

    if (res.ok) {
        confirm("Upload successful", true);
        addCard(data.file);
        allFiles.push(data.file);
        renderFiles();
    } else {
        confirm("Upload failed", false);
        console.log(data.error);
    }
});

// Confirms action was successful or not
function confirm(msg, success) {
    const conf = document.getElementById("confirm");
    conf.textContent = msg;
    conf.style.color = success ? "green" : "red";
    conf.style.visibility = 'visible';
}