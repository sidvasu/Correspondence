document.getElementById("logout").onclick = async function () {
    await fetch('/logout', { method: 'POST' });
    window.location.href = '../index.html';
};