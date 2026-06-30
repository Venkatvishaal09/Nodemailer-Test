import { useState } from "react";

export default function LoginView({ onLogin, onToggleView, showToast }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast("error", "Please enter both email and password.");
      return;
    }
    
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      
      if (data.success) {
        onLogin(data.token);
      } else {
        showToast("error", data.error || "Login failed");
      }
    } catch (err) {
      showToast("error", "Network error. Please try again.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <span className="material-icons-outlined brand-icon">mail</span>
          </div>
          <h2>Welcome back</h2>
          <p>Sign in to your account to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary login-btn">
            Sign In
          </button>
        </form>

        <div className="login-footer">
          <p>
            Don't have an account?{" "}
            <a href="#" onClick={(e) => { e.preventDefault(); onToggleView(); }}>
              <strong>Sign Up</strong>
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
