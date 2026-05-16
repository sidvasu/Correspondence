// Adds a file card on the share page
function addCard(file) {
    const fileList = document.getElementById("file-list");
    const card = document.createElement("div");
    card.classList.add("file-card");
    card.dataset.id = file.id;

    if (file.ownedByCurrentUser) {
        card.innerHTML = `
            <p>${file.owner}</p>
            <a target=" " href="/upload/${file.id}" class="file-link">${file.filename}</a>
            <input class="rename-input" type="text" value="${file.filename}" style="display:none;" />
            <button class="rename-btn">✏️</button>
            <button class="confirm-rename-btn" style="display:none;">✅</button>
            <button class="cancel-rename-btn" style="display:none;">❌</button>
            <button class="delete-btn">🗑️</button>
        `;
    } else {
        card.innerHTML = `
            <p>${file.owner}</p>
            <a target=" " href="/upload/${file.id}" class="file-link">${file.filename}</a>
        `;
    }

    fileList.appendChild(card);

    // Delete button logic
    const deleteBtn = card.querySelector(".delete-btn");
    if (deleteBtn) {
        deleteBtn.addEventListener("click", async () => {
            const fileId = card.dataset.id;
            const res = await fetch(`/files/${fileId}`, { method: "DELETE" });
            const data = await res.json();
            if (res.ok) {
                allFiles = allFiles.filter(f => String(f.id) !== fileId);
                card.remove();
            } else {
                alert(data.error);
            }
        });
    }

    // Rename button logic
    const renameBtn = card.querySelector(".rename-btn");
    if (renameBtn) {
        const fileLink = card.querySelector(".file-link");
        const renameInput = card.querySelector(".rename-input");
        const confirmBtn = card.querySelector(".confirm-rename-btn");
        const cancelBtn = card.querySelector(".cancel-rename-btn");

        const enterEditMode = () => {
            renameInput.value = fileLink.textContent.trim();
            fileLink.style.display = "none";
            renameInput.style.display = "inline";
            renameBtn.style.display = "none";
            confirmBtn.style.display = "inline";
            cancelBtn.style.display = "inline";
            renameInput.focus();
        };

        const exitEditMode = () => {
            fileLink.style.display = "inline";
            renameInput.style.display = "none";
            renameBtn.style.display = "inline";
            confirmBtn.style.display = "none";
            cancelBtn.style.display = "none";
        };

        const submitRename = async () => {
            const newName = renameInput.value.trim();
            if (!newName) {
                alert("Filename cannot be empty.");
                return;
            }
            if (newName === fileLink.textContent.trim()) {
                exitEditMode();
                return;
            }

            const fileId = card.dataset.id;
            const res = await fetch(`/files/${fileId}/rename`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ filename: newName })
            });
            const data = await res.json();

            if (res.ok) {
                fileLink.textContent = newName;
                const fileId = card.dataset.id;
                const entry = allFiles.find(f => String(f.id) === fileId);
                if (entry) entry.filename = newName;
                exitEditMode();
            } else {
                alert(data.error);
            }
        };

        renameBtn.addEventListener("click", enterEditMode);
        cancelBtn.addEventListener("click", exitEditMode);
        confirmBtn.addEventListener("click", submitRename);
        renameInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") submitRename();
            if (e.key === "Escape") exitEditMode();
        });
    }
}

let allFiles = [];
let sortOrder = 'asc';
let showMyFilesOnly = false;

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
function updateSortBtn() {
    document.getElementById("sortBtn").textContent = sortOrder === 'asc' ? 'A → Z' : 'Z → A';
}

// Filter button functionality
function updateFilterBtn() {
    document.getElementById("filterBtn").textContent = showMyFilesOnly ? 'All Files' : 'My Files';
}

// Displays files on page load
async function loadFiles() {
    const res = await fetch('/files');
    allFiles = await res.json();
    renderFiles();
}

document.getElementById("sortBtn").addEventListener("click", () => {
    sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    updateSortBtn();
    renderFiles();
});

document.getElementById("filterBtn").addEventListener("click", () => {
    showMyFilesOnly = !showMyFilesOnly;
    updateFilterBtn();
    renderFiles();
});

updateSortBtn();
updateFilterBtn();
loadFiles();

// Logout button functionality
document.getElementById("logout").onclick = async function () {
    await fetch('/logout', { method: 'POST' });
    window.location.href = '../index.html';
};

// Upload button functionality
document.getElementById("uploadBtn").addEventListener("click", async () => {
    const fileInput = document.getElementById("fileInput");

    if (fileInput.files.length === 0) {
        alert("Please select a file");
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
        console.log("Upload successful");
        allFiles.push(data.file);
        renderFiles();
    } else {
        alert(data.error);
    }
});