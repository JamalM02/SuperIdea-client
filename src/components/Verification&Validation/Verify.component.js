import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import emailjs from 'emailjs-com';
import { registerUser } from '../../services/api.service';
import { formatFullName } from './formatUtils';

function VerifyComponent() {
    const [userInputCode, setUserInputCode] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [countdown, setCountdown] = useState(180); // 3 minutes countdown
    const [canResend, setCanResend] = useState(false);
    const [isVerifyDisabled, setIsVerifyDisabled] = useState(true);
    const [isCodeValid, setIsCodeValid] = useState(true); // Track code validity
    const [abortController, setAbortController] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const timerRef = useRef(null);
    const emailSentRef = useRef(false);

    const { email, fullName, password } = location.state || {};

    useEffect(() => {
        if (!emailSentRef.current) {
            generateAndSendCode();
            emailSentRef.current = true;
        }
        startCountdown();
        return () => {
            clearInterval(timerRef.current);
        };
    }, []);

    useEffect(() => {
        setIsVerifyDisabled(userInputCode.length === 0);
    }, [userInputCode]);

    const generateAndSendCode = async () => {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setVerificationCode(code);
        setIsCodeValid(true); // Set code as valid when generated
        await sendVerificationEmail(code);
    };

    const sendVerificationEmail = async (code) => {
        const serviceId = process.env.REACT_APP_EMAILJS_SERVICE_ID;
        const templateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID;
        const publicKey = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;
        const templateParams = {
            to_name: formatFullName(fullName),
            to_email: email.toLowerCase(),
            verification_code: code
        };

        if (abortController) {
            abortController.abort();
        }

        const newAbortController = new AbortController();
        setAbortController(newAbortController);

        await new Promise(resolve => setTimeout(resolve, 3000));

        try {
            await emailjs.send(serviceId, templateId, templateParams, publicKey, { signal: newAbortController.signal });
            toast.success('Verification&Validation code sent! Please check your email.');
        } catch (error) {
            if (newAbortController.signal.aborted) {
                console.log('Email sending canceled');
            } else {
                console.error('Failed to send email:', error);
                toast.error('Failed to send verification code. Please try again.');
            }
        }
    };

    const startCountdown = () => {
        timerRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev > 1) {
                    return prev - 1;
                } else {
                    clearInterval(timerRef.current);
                    setCanResend(true);
                    setIsCodeValid(false); // Invalidate code when countdown reaches zero
                    return 0;
                }
            });
        }, 1000);
    };

    const handleVerification = async () => {
        if (!isCodeValid) {
            toast.error('Verification&Validation code has expired');
            return;
        }

        if (userInputCode === verificationCode) {
            const userData = {
                email: email.toLowerCase(),
                password: password,
                fullName: formatFullName(fullName),
                type: "Student",
                isVerified: true
            };

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
            generateAndSendCode();
            setCountdown(180);
            setCanResend(false);
            startCountdown();
        }
    };

    const handleCancelVerification = () => {
        navigate('/register');
    };

    return (
        <div className="verify-container">
            <h2 className="verify-heading">Enter Verification Code</h2>
            <input
                type="text"
                className="verify-input"
                placeholder="Verification Code"
                value={userInputCode}
                onChange={(e) => setUserInputCode(e.target.value)}
            />
            <button className="btn btn-primary verify-btn" onClick={handleVerification} disabled={isVerifyDisabled}>
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
                    <p style={{color: "ActiveCaption" ,fontWeight:"bold"}}>Verification code will expired in  {Math.floor(countdown / 60)}:{countdown % 60 < 10 ? `0${countdown % 60}` : countdown % 60} minutes</p>
                )}
            </div>
        </div>
    );
}

export default VerifyComponent;