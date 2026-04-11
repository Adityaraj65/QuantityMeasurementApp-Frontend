const API_URL = "http://localhost:8080/auth";

const authTitle = document.getElementById('authTitle');
const authSubtitle = document.getElementById('authSubtitle');
const submitBtn = document.getElementById('submitAuth');
const toggleBtn = document.getElementById('toggleBtn');
const toggleLabel = document.getElementById('toggleLabel');

let isLogin = true;

toggleBtn.addEventListener('click', () => {
    isLogin = !isLogin;
    authTitle.innerText = isLogin ? "Welcome Back" : "Create Account";
    authSubtitle.innerText = isLogin ? "Login to access your history" : "Join QuantifyPro today";
    submitBtn.innerText = isLogin ? "Login" : "Register";
    toggleLabel.innerText = isLogin ? "Don't have an account?" : "Already have an account?";
    toggleBtn.innerText = isLogin ? "Sign Up" : "Login";
});

submitBtn.addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('pass').value;

    const endpoint = isLogin ? "/login" : "/register";
    
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.text();

        if (response.ok) {
            if (isLogin) {
                localStorage.setItem('token', data); // Save JWT
                localStorage.setItem('userEmail', email);
                window.location.href = "index.html";
            } else {
                alert("Registration Successful! Please Login.");
                toggleBtn.click();
            }
        } else {
            alert(data || "Authentication Failed");
        }
    } catch (error) {
        console.error("Auth Error:", error);
        alert("Server connection failed.");
    }
});