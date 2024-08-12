import React, { useState } from 'react';
import './Register.component.css';
import { registerUser } from '../../services/api.service';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import emailjs from 'emailjs-com';

function RegisterComponent() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [type, setType] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [fullNameError, setFullNameError] = useState('');
    const [typeError, setTypeError] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [userInputCode, setUserInputCode] = useState('');
    const [isCodeSent, setIsCodeSent] = useState(false);
    const navigate = useNavigate();

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    };

    const validatePassword = (password) => {
        return password.length >= 6;
    };

    const sendVerificationEmail = (userEmail, code) => {

        const serviceId = 'service_i0ttfyd';
        const templateId = 'template_83mscdg';
        const publicKey = 'XX1LO1JMqlpzfXnkT';
        const templateParams = {
            to_name: fullName,
            to_email: userEmail,
            verification_code: code
        };

        emailjs.send(serviceId, templateId, templateParams, publicKey)
            .then((response) => {
                console.log('Email sent successfully!', response.status, response.text);
            })
            .catch((error) => {
                console.error('Failed to send email:', error);
            });
    };

    const handleRegister = async () => {
        let valid = true;

        if (!email || !validateEmail(email)) {
            setEmailError('Please enter a valid email address');
            valid = false;
        } else {
            setEmailError('');
        }

        if (!password || !validatePassword(password)) {
            setPasswordError('Password must be at least 6 characters long');
            valid = false;
        } else {
            setPasswordError('');
        }

        if (!fullName) {
            setFullNameError('Full name is required');
            valid = false;
        } else {
            setFullNameError('');
        }

        if (!type) {
            setTypeError('Please select a user type');
            valid = false;
        } else {
            setTypeError('');
        }

        if (!valid) return;

        try {
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            setVerificationCode(code);
            sendVerificationEmail(email, code);
            setIsCodeSent(true);
            toast.success('Verification code sent! Please check your email.');
        } catch (error) {
            console.error('Failed to send verification code', error);
            toast.error('Failed to send verification code. Please try again.');
        }
    };

    const handleVerification = async () => {
        if (verificationCode === userInputCode) {
            try {
                const response = await registerUser({ email, password, fullName, type, isVerified: true });
                if (response) {
                    toast.success('Registration successful!');
                    navigate('/login');
                }
            } catch (error) {
                console.error('Failed to register', error);
                toast.error('Registration failed! Please try again.');
            }
        } else {
            toast.error('Invalid verification code');
        }
    };

    return (
        <div className="register-container">
            <h1 className="register-heading">Register</h1>
            {!isCodeSent ? (
                <>
                    <div className="register-form-group">
                        <label className="register-email-head">Email address</label>
                        <input
                            type="email"
                            className="register-form-control"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter email"
                            autoComplete="email"
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
                        />
                        {fullNameError && <div className="text-danger">{fullNameError}</div>}
                    </div>
                    <div className="register-form-group">
                        <label className="register-type-head">User type</label>
                        <select className="register-form-control" value={type} onChange={(e) => setType(e.target.value)} autoComplete="off">
                            <option value="">Select type</option>
                            <option value="Student">Student</option>
                            <option value="Teacher">Teacher</option>
                        </select>
                        {typeError && <div className="text-danger">{typeError}</div>}
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
                </>
            ) : (
                <div className="verification-container">
                    <h2 className="verification-heading">Enter Verification Code</h2>
                    <input
                        type="text"
                        className="verification-input"
                        placeholder="Verification Code"
                        value={userInputCode}
                        onChange={(e) => setUserInputCode(e.target.value)}
                    />
                    <button className="btn btn-primary verification-btn" onClick={handleVerification}>
                        Verify
                    </button>
                </div>
            )}
        </div>
    );
}

export default RegisterComponent;
