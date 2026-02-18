document.addEventListener('DOMContentLoaded', () => {
    // Registration Logic
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const messageDiv = document.getElementById('message');

            const userData = {
                userId: document.getElementById('userId').value,
                username: document.getElementById('username').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                password: document.getElementById('password').value
            };

            try {
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userData)
                });

                const data = await response.json();

                if (response.ok) {
                    messageDiv.textContent = data.message + ' Redirecting to login...';
                    messageDiv.className = 'message success';
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                } else {
                    messageDiv.textContent = data.message;
                    messageDiv.className = 'message error';
                }
            } catch (err) {
                messageDiv.textContent = 'Connection error. Is the server running?';
                messageDiv.className = 'message error';
            }
        });
    }

    // Login Logic
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const messageDiv = document.getElementById('loginMessage');

            const loginData = {
                username: document.getElementById('loginUsername').value,
                password: document.getElementById('loginPassword').value
            };

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(loginData)
                });

                const data = await response.json();

                if (response.ok) {
                    messageDiv.textContent = 'Login successful! Redirecting...';
                    messageDiv.className = 'message success';
                    setTimeout(() => {
                        window.location.href = data.redirect;
                    }, 1500);
                } else {
                    messageDiv.textContent = data.message;
                    messageDiv.className = 'message error';
                }
            } catch (err) {
                messageDiv.textContent = 'Connection error. Is the server running?';
                messageDiv.className = 'message error';
            }
        });
    }
});
