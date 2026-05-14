document.getElementById("login").onclick = async function () {
    const res = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: document.getElementById('login-username').value,
            password: document.getElementById('login-password').value,
        })
    });
    
    const data = await res.json();
    if (res.ok) {
        window.location.href = '../share.html';
    } else {
        showError(data.error);
    }
};

function showError(msg) {
    const el = document.getElementById('login-error');
    el.textContent = msg;
    el.style.visibility = 'visible';
}
