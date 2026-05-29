import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/LoginPage.css';

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(formData);

    console.log("LOGIN RESULT =", result);

    if (result.success) {
      alert("LOGIN SUCCESS");
      navigate("/");
    } else {
      alert("LOGIN FAILED: " + result.message);
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">

        <h2>Welcome Back 👋</h2>
        <p>Sign in to continue your chess journey</p>

        {error && <p className="alert-error">{error}</p>}

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label>Email</label>
            <input 
              name="email" 
              type="email"
              placeholder="Enter your email"
              onChange={handleChange}
              required 
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input 
              name="password" 
              type="password"
              placeholder="Enter your password"
              onChange={handleChange}
              required 
            />
          </div>

          <button type="submit" className="btn-submit">
            {loading ? "Signing In..." : "Sign In"}
          </button>

          <p className="link-text">
            Don’t have an account? <Link to="/register">Register here</Link>
          </p>

        </form>

      </div>
    </div>
  );
};

export default LoginPage;