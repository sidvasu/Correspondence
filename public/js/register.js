document.getElementById("register").onclick = async function () {
    const res = await fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: document.getElementById('register-username').value,
            password: document.getElementById('register-password').value,
        })
    });
    
    const data = await res.json();
    if (res.ok) {
        window.location.href = '../index.html';
    } else {
        showError(data.error);
    }
};

function showError(msg) {
    const el = document.getElementById('register-error');
    el.textContent = msg;
    el.style.display = 'block';
}
