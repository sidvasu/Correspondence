function addCard(file) {
    const fileList = document.getElementById("file-list");
    const card = document.createElement("div");
    card.classList.add("file-card");
    card.dataset.id = file.id;

    if (file.ownedByCurrentUser) {
        card.innerHTML = `
            <p>${file.owner}</p>
            <a target=" " href="/upload/${file.id}" class="file-link">${file.filename}</a>
            <button class="rename-btn">✏️</button>
            <button class="delete-btn">🗑️</button>
        `;
    } else {
        card.innerHTML = `
            <p style="margin-bottom: 0px">${file.owner}</p>
            <a target=" " href="/upload/${file.id}" class="file-link">${file.filename}</a>
        `;
    }

    fileList.appendChild(card);

    const deleteBtn = card.querySelector(".delete-btn");
    if (deleteBtn) {
        deleteBtn.addEventListener("click", async () => {
            const fileId = card.dataset.id;
            const res = await fetch(`/files/${fileId}`, { method: "DELETE" });
            const data = await res.json();
            if (res.ok) {
                card.remove();
            } else {
                alert(data.error);
            }
        });
    }

    const renameBtn = card.querySelector(".rename-btn");
    if (renameBtn) {
        renameBtn.addEventListener("click", async () => {
            const newName = prompt(
                "Enter new filename:",
                file.filename
            );
            if (!newName) {
                return;
            }
            const res = await fetch(
                `/files/${file.id}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        filename: newName
                    })
                }
            );

            const data = await res.json();
            if (res.ok) {
                const fileLink = card.querySelector(".file-link");
                fileLink.textContent = data.filename;
            } else {
                alert(data.error);
            }
        });
    }
}

let allFiles = [];
let sortOrder = 'asc';
let showMyFilesOnly = false;

// Displays files on page load
async function loadFiles() {
    const res = await fetch('/files');
    allFiles = await res.json();
    allFiles.forEach(file => addCard(file));
    renderFiles();
}

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
    console.log("renderFiles called, allFiles:", allFiles);
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

document.getElementById("logout").onclick = async function () {
    await fetch('/logout', { method: 'POST' });
    window.location.href = '../index.html';
};

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
        addCard(data.file);
    } else {
        alert(data.error);
    }
});