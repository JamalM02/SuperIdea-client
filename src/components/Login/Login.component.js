import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginUser, verify2FA } from '../../services/api.service';
import { toast } from 'react-toastify';
import { Button, Spinner, Modal } from "react-bootstrap";
import './Login.component.css';

function LoginComponent({ setUser }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [show2FAModal, setShow2FAModal] = useState(false);
    const [token, setToken] = useState('');
    const [userId, setUserId] = useState(null);
    const [loadingLogin, setLoadingLogin] = useState(false);
    const [loadingVerify, setLoadingVerify] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (location.state && location.state.email) {
            setEmail(location.state.email);
        }
    }, [location.state]);

    const handleLogin = async () => {
        setLoadingLogin(true);
        try {
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

            const normalizedEmail = email.toLowerCase();

            try {
                const response = await loginUser({ email: normalizedEmail, password });
                if (response) {
                    if (response.isTwoFactorEnabled) {
                        setUserId(response._id);
                        setShow2FAModal(true);
                    } else {
                        localStorage.setItem('user', JSON.stringify(response));
                        setUser(response);
                        toast.success('Logged-in successfully!');
                        navigate('/user-account');
                    }
                }
            } catch (error) {
                console.error('Failed to login', error);
                toast.error('Invalid email or password');
            }
        } catch (error) {
            console.error('Error logging in:', error);
            toast.error('Failed to login');
        } finally {
            setLoadingLogin(false);
        }
    };

    const handleVerify2FA = async () => {
        setLoadingVerify(true);
        try {
            const verificationResponse = await verify2FA(userId, token);
            if (verificationResponse.success) {
                const response = await loginUser({ email: email.toLowerCase(), password });
                if (response) {
                    localStorage.setItem('user', JSON.stringify(response));
                    setUser(response);
                    toast.success('Logged-in successfully!');
                    navigate('/user-account');
                }
            } else {
                toast.error('Invalid 2FA token');
            }
        } catch (error) {
            console.error('Failed to verify 2FA', error);
            toast.error('Failed to verify 2FA token');
        } finally {
            setLoadingVerify(false);
        }
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
            <Button variant="primary" onClick={handleLogin} disabled={loadingLogin}>
                {loadingLogin ? <Spinner animation="border" size="sm" /> : 'Login'}
            </Button>
            <div className="login-register-link">
                <small>
                    <a href="/register" className="text-muted">Don't have an account? Register</a>
                </small>
            </div>

            {/* 2FA Modal */}
            <Modal show={show2FAModal} onHide={() => setShow2FAModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Two-Factor Authentication</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Please enter your 2FA token:</p>
                    <input
                        type="text"
                        className="form-control"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="Enter 2FA token"
                    />
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShow2FAModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleVerify2FA} disabled={loadingVerify}>
                        {loadingVerify ? <Spinner animation="border" size="sm" /> : 'Verify'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default LoginComponent;
