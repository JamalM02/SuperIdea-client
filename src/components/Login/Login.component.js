import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { toast } from 'react-toastify';
import { loginUser } from '../../services/api.service';
import './Login.component.css';

function LoginComponent({ setUser }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async () => {
        let valid = true;

        if (!email) {
            setEmailError('Email is required');
            valid = false;
        } else {
            setEmailError('');
        }

        if (!password) {
            setPasswordError('Password is required');
            valid = false;
        } else {
            setPasswordError('');
        }

        if (!valid) return;

        try {
            const response = await loginUser({ email, password });
            if (response) {
                localStorage.setItem('user', JSON.stringify(response));
                setUser(response);
                toast.success('Logged-in successful!');
                navigate('/user-account');
            }
        } catch (error) {
            console.error('Failed to login', error);
            toast.error('Invalid email or password');
        }
    };

    const handleGoogleLoginSuccess = (response) => {
        window.location.href = `${process.env.REACT_APP_API_URL_DEV}/users/auth/google`;
    };

    const handleGoogleLoginFailure = (response) => {
        console.error('Google Login Failed', response);
        toast.error('Google login failed');
    };

    return (
        <div className="login-container">
            <h3 className="login-heading">Welcome Back!</h3>
            <div className="login-form-group">
                <label className="login-email-head">Email address</label>
                <input
                    type="email"
                    className="login-form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email"
                    required
                    autoComplete="email"
                />
                {emailError && <div className="text-danger">{emailError}</div>}
            </div>
            <div className="login-form-group">
                <label className="login-password-head">Password</label>
                <input
                    type="password"
                    className="login-form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                    autoComplete="current-password"
                />
                {passwordError && <div className="text-danger">{passwordError}</div>}
            </div>
            <button className="btn btn-primary login-btn" onClick={handleLogin}>Login</button>
            <GoogleLogin
                onSuccess={handleGoogleLoginSuccess}
                onFailure={handleGoogleLoginFailure}
            />
            <div className="login-register-link">
                <small>
                    <a href="/register" className="text-muted">Don't have an account? Register</a>
                </small>
            </div>
        </div>
    );
}

export default LoginComponent;
