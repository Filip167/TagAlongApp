import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css'; // Import the new CSS file

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post('http://localhost:5001/api/users/login', {
        emailOrUsername: identifier,
        password,
      });
      console.log(data);  // Log the data to see what is being returned
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username);
      navigate(`/dashboard/${data.username}`);
    } catch (error) {
      console.error('Login error:', error.response ? error.response.data.message : error.message);
      alert('Login failed. Please try again.');
    }
  };
  
  return (
    <form onSubmit={handleSubmit} autoComplete="off" className="login-form">
      <div className="input-group">
        <label htmlFor="identifier">Email Address or Username</label>
        <input
          type="text"
          id="identifier"
          name="identifier"
          placeholder="Enter Email or Username"
          required
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />
      </div>
      <div className="input-group">
        <label htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          name="password"
          placeholder="Enter Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="options">
        <label>
          <input type="checkbox" name="remember" />
          Remember me
        </label>
        <Link to="/forgot-password">Forgot password?</Link>
      </div>
      <button type="submit" className="login-button">Login</button>
      <p>Don't have an account? <Link to="/signup" className="signup-link">Sign Up</Link></p>
    </form>
  );
};

export default Login;
