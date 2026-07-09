// Register button functionality
document.getElementById("register").onclick = async function () {
    const registerUsername = document.getElementById('register-username').value;
    const registerPassword = document.getElementById('register-password').value;

    if (!registerUsername || !registerPassword) {
        showError("Username and password are required");
        return;
    }

    const res = await fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: registerUsername,
            password: registerPassword,
        })
    });
    
    const data = await res.json();
    if (res.ok) {
        window.location.href = '../index.html';
    } else {
        showError(data.error);
    }
};

// Displays error on screen
function showError(msg) {
    const el = document.getElementById('register-error');
    el.textContent = msg;
    el.style.visibility = 'visible';
}
