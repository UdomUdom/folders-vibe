document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const loginErrorEl = document.getElementById('login-error');
    const registerErrorEl = document.getElementById('register-error');

    const API_BASE_URL = 'http://localhost:8080/api'; // Adjust if your backend runs elsewhere

    // Toggle between login and register forms
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        loginErrorEl.textContent = '';
        registerErrorEl.textContent = '';
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
        loginErrorEl.textContent = '';
        registerErrorEl.textContent = '';
    });

    // Login form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginErrorEl.textContent = '';
        const username = loginForm.username.value.trim();
        const password = loginForm.password.value.trim();

        if (!username || !password) {
            loginErrorEl.textContent = 'Username and password are required.';
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userId', data.user_id);
                localStorage.setItem('username', data.username);
                window.location.href = 'chat.html'; // Redirect to chat page
            } else {
                loginErrorEl.textContent = data.error || data.message || 'Login failed. Please check your credentials.';
            }
        } catch (error) {
            console.error('Login error:', error);
            loginErrorEl.textContent = 'An error occurred. Please try again.';
        }
    });

    // Registration form submission
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        registerErrorEl.textContent = '';
        const username = registerForm.username.value.trim();
        const password = registerForm.password.value.trim();
        const confirmPassword = registerForm.confirm_password.value.trim();

        if (!username || !password || !confirmPassword) {
            registerErrorEl.textContent = 'All fields are required.';
            return;
        }
        if (password !== confirmPassword) {
            registerErrorEl.textContent = 'Passwords do not match.';
            return;
        }
        if (password.length < 6) {
            registerErrorEl.textContent = 'Password must be at least 6 characters long.';
            return;
        }
         if (username.length < 3) {
            registerErrorEl.textContent = 'Username must be at least 3 characters long.';
            return;
        }


        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Successfully registered, proceed to login or auto-login
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userId', data.user_id);
                localStorage.setItem('username', data.username);
                window.location.href = 'chat.html'; // Redirect to chat page
            } else {
                registerErrorEl.textContent = data.error || data.message || 'Registration failed. Username might be taken.';
            }
        } catch (error) {
            console.error('Registration error:', error);
            registerErrorEl.textContent = 'An error occurred during registration.';
        }
    });
});
