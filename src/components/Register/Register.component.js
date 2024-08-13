import React, {useState, useEffect, useRef} from 'react';
import './Register.component.css';
import {registerUser, checkUserExistence} from '../../services/api.service';
import {useNavigate, useLocation} from 'react-router-dom';
import {toast} from 'react-toastify';
import emailjs from 'emailjs-com';
import { validateEmail, validateFullName, formatFullName } from './formatUtils';

function RegisterComponent() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [fullNameError, setFullNameError] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [userInputCode, setUserInputCode] = useState('');
    const [isCodeSent, setIsCodeSent] = useState(false);
    const [countdown, setCountdown] = useState(120); // 2 minutes countdown
    const [canResend, setCanResend] = useState(false);
    const [isVerifyDisabled, setIsVerifyDisabled] = useState(true); // Disable verify button initially
    const [abortController, setAbortController] = useState(null); // Add AbortController state
    const navigate = useNavigate();
    const location = useLocation();
    const timerRef = useRef(null);

    useEffect(() => {
        if (location.state) {
            setEmail(location.state.email || '');
            setFullName(location.state.fullName || '');
            setPassword(''); // Reset password field for Google users
        }
    }, [location.state]);

    useEffect(() => {
        if (isCodeSent) {
            startCountdown();
        }
        return () => {
            clearInterval(timerRef.current);
        };
    }, [isCodeSent]);

    useEffect(() => {
        setIsVerifyDisabled(userInputCode.length === 0);
    }, [userInputCode]);

    const startCountdown = () => {
        timerRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev > 1) {
                    return prev - 1;
                } else {
                    clearInterval(timerRef.current);
                    setCanResend(true);
                    return 0;
                }
            });
        }, 1000);
    };

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

    const sendVerificationEmail = async (userEmail, code, controller) => {
        const serviceId = process.env.REACT_APP_EMAILJS_SERVICE_ID;
        const templateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID;
        const publicKey = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;
        const templateParams = {
            to_name: userEmail.fullName,
            to_email: userEmail.email,
            verification_code: code
        };

        await new Promise(resolve => setTimeout(resolve, 10000));

        try {
            await emailjs.send(serviceId, templateId, templateParams, publicKey, {signal: controller.signal});
            console.log('Email sent successfully!');
        } catch (error) {
            if (controller.signal.aborted) {
                console.log('Email sending canceled');
            } else {
                console.error('Failed to send email:', error);
            }
        }
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

        // Cancel previous request if there is one
        if (abortController) {
            abortController.abort();
        }

        // Create a new AbortController
        const newAbortController = new AbortController();
        setAbortController(newAbortController);

        try {
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            setVerificationCode(code);
            sendVerificationEmail(validated, code, newAbortController);
            setIsCodeSent(true);
            setCountdown(120);
            setCanResend(false);
            toast.success('Verification code sent! Please check your email.');
        } catch (error) {
            console.error('Failed to send verification code', error);
            toast.error('Failed to send verification code. Please try again.');
        }
    };

    const handleVerification = async () => {
    const { validated } = normalizeAndValidate(email, fullName);
        if (verificationCode === userInputCode) {
            const userData = {
            email: validated.email,
                password: password,
                fullName: validated.fullName = formatFullName(fullName),
                type: "Student",
                isVerified: true
            };

            console.log("User Data:", userData);

            try {
                const response = await registerUser(userData);
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

    const handleResendCode = () => {
        if (canResend) {
            // Cancel previous request if there is one
            if (abortController) {
                abortController.abort();
            }

            // Create a new AbortController
            const newAbortController = new AbortController();
            setAbortController(newAbortController);

            const code = Math.floor(100000 + Math.random() * 900000).toString();
            setVerificationCode(code);
            sendVerificationEmail({ email: email.toLowerCase(), fullName: formatFullName(fullName) }, code, newAbortController);
            setCountdown(120);
            setCanResend(false);
            toast.success('New verification code sent! Please check your email.');
            startCountdown();
        }
    };

    const handleCancelVerification = () => {
        setIsCodeSent(false);
        setCountdown(120);
        setCanResend(false);
        setUserInputCode('');
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
                    <button
                        className="btn btn-primary verification-btn"
                        onClick={handleVerification}
                        disabled={isVerifyDisabled} // Disable button when input is empty
                    >
                        Verify
                    </button>
                    <button className="btn btn-secondary cancel-btn" onClick={handleCancelVerification}>
                        Cancel
                    </button>
                    <div className="resend-container">
                        {canResend ? (
                            <button className="btn btn-secondary resend-btn" onClick={handleResendCode}>
                                Resend Code
                            </button>
                        ) : (
                            <p>You can resend the code in {Math.floor(countdown / 60)}:{countdown % 60 < 10 ? `0${countdown % 60}` : countdown % 60} minutes</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default RegisterComponent;
