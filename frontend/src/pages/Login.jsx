import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Mail, Lock } from 'lucide-react';
import NetworkBackground from '../components/NetworkBackground';
import './Login.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Login() {
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(''); 

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(''); 
        
        try {
            const res = await axios.post(`${API_BASE}/api/login`, {
                email,
                password
            });

            // 1. Set the user in global context
            login(res.data.user, res.data.token);

            // 2. Redirect the user to the Dashboard/Home page
            navigate('/');
            
        } catch (err) {
            if (err.response && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError('Network error. Please try again later.');
            }
        }
    };

    return (
      <>
        {/* 2. Add the animated background behind everything */}
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1, pointerEvents: 'none' }}>
            <NetworkBackground />
        </div>

        <div className="login-wrapper">
            <div className="login-card">
                
                <div className="login-header">
                    {/* Ensure ojas-logo.jpg is inside frontend/public/ */}
                    <img src="/logo.png" alt="Ojas Logo" className="login-logo" />
                    <h2 className="login-title">Ojas Connect</h2>
                </div>

                <form className="login-form-container" onSubmit={handleLogin}>
                    {error && <div className="error-message">{error}</div>}
                    
                    <div className="input-group">
                        <Mail size={20} className="input-icon" />
                        <input 
                            type="email" 
                            className="login-input"
                            placeholder="Email ID" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            required 
                        />
                    </div>

                    <div className="input-group">
                        <Lock size={20} className="input-icon" />
                        <input 
                            type="password" 
                            className="login-input"
                            placeholder="Password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                        />
                    </div>

                    <div className="login-options">
                        <label className="remember-me">
                            <input type="checkbox" /> Remember me
                        </label>
                        {/* Note: Password recovery handles Mobile/Email on the backend */}
                        <a href="#forgot" className="forgot-password" onClick={(e) => {
                            e.preventDefault();
                            alert("Password recovery via Email/Mobile will be triggered.");
                        }}>
                            Forgot Password?
                        </a>
                    </div>

                    <button type="submit" className="login-button">
                        LOGIN
                    </button>
                </form>
            </div>
        </div>
      </>
    );
}