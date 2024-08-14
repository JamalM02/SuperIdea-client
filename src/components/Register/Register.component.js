import React, { useState, useEffect } from 'react';
import './Register.component.css';
import { checkUserExistence } from '../../services/api.service';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { validateEmail, validateFullName, formatFullName } from '../Verification&Validation/formatUtils';

function RegisterComponent() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [fullNameError, setFullNameError] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (location.state) {
            setEmail(location.state.email || '');
            setFullName(location.state.fullName || '');
            setPassword(''); // Reset password field for Google users
        }
    }, [location.state]);

    const normalizeAndValidate = (email, fullName) => {
        const errors = {};
        const validated = {
            email: '',
            fullName: ''
        };

        if (!email || !validateEmail(email)) {
            errors.email = 'Please enter a valid email address';
        } else {
            validated.email = email.toLowerCase();
        }

        if (!fullName || !validateFullName(fullName)) {
            errors.fullName = 'Full name is required and should contain at least two words';
        } else {
            validated.fullName = formatFullName(fullName);
        }

        return { errors, validated };
    };

    const handleRegister = async () => {
        const { errors, validated } = normalizeAndValidate(email, fullName);
        setEmailError(errors.email || '');
        setFullNameError(errors.fullName || '');

        if (Object.keys(errors).length > 0) {
            return;
        }

        if (!location.state && (!password || password.length < 6)) {
            setPasswordError('Password must be at least 6 characters long');
            return;
        } else {
            setPasswordError('');
        }

        try {
            await checkUserExistence({ email: validated.email, fullName: validated.fullName });
        } catch (error) {
            if (error.field === 'email') {
                setEmailError(error.message);
            } else if (error.field === 'fullName') {
                setFullNameError(error.message);
            }
            return;
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        navigate('/verify', { state: { email: validated.email, fullName: validated.fullName, verificationCode: code, password: password } });
    };

    return (
        <div className="register-container">
            <h1 className="register-heading">Register</h1>
            <div className="register-form-group">
                <label className="register-email-head">Email address</label>
                <input
                    type="email"
                    className="register-form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email"
                    autoComplete="email"
                    disabled={!!location.state} // Disable email input if redirected from Google login
                />
                {emailError && <div className="text-danger">{emailError}</div>}
            </div>
            <div className="register-form-group">
                <label className="register-password-head">Password</label>
                <input
                    type="password"
                    className="register-form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    autoComplete="new-password"
                    disabled={!!location.state} // Disable password input if redirected from Google login
                />
                {passwordError && <div className="text-danger">{passwordError}</div>}
            </div>
            <div className="register-form-group">
                <label className="register-fullname-head">Full name</label>
                <input
                    type="text"
                    className="register-form-control"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter Name"
                    autoComplete="name"
                    disabled={!!location.state} // Disable full name input if redirected from Google login
                />
                {fullNameError && <div className="text-danger">{fullNameError}</div>}
            </div>
            <div className="text-center mt-4">
                <button className="btn btn-primary register-btn" onClick={handleRegister}>
                    Register
                </button>
            </div>
            <div className="register-link">
                <small>
                    <a href="/login" className="text-muted">Already have an account? Login</a>
                </small>
            </div>
        </div>
    );
}

export default RegisterComponent;