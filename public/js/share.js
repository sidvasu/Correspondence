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

async function loadFiles() {
    const res = await fetch('/files');
    const files = await res.json();
    files.forEach(file => addCard(file));
}

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