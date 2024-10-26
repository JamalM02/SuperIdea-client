import React, { useState, useEffect } from 'react';
import './Register.component.css';
import { checkUserExistence } from '../../services/api.service';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { validateEmail, validateFullName, formatFullName } from '../Verification&Validation/formatUtils';
import { Spinner, Modal, Button } from 'react-bootstrap';
const OurMail = process.env.REACT_APP_ADMIN_EMAIL;

function RegisterComponent() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [fullNameError, setFullNameError] = useState('');
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [termsError, setTermsError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false); // Modal state
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (location.state) {
            setEmail(location.state.email || '');
            setFullName(location.state.fullName || '');
            setPassword('');
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
        setTermsError('');

        if (!acceptedTerms) {
            setTermsError('You must accept the terms and policy to register');
            return;
        }

        if (Object.keys(errors).length > 0) {
            return;
        }

        if (!location.state && (!password || password.length < 6)) {
            setPasswordError('Password must be at least 6 characters long');
            return;
        } else {
            setPasswordError('');
        }

        setLoading(true);

        try {
            await checkUserExistence({ email: validated.email, fullName: validated.fullName });
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        navigate('/verify', {
            state: {
                email: validated.email,
                fullName: validated.fullName,
                context: 'registration',
                    verificationCode: code,
                    password: password,
            }
        });
        } catch (error) {
            if (error.field === 'email') {
                setEmailError(error.message);
            } else if (error.field === 'fullName') {
                setFullNameError(error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleShowTermsModal = () => setShowTermsModal(true);
    const handleCloseTermsModal = () => setShowTermsModal(false);

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
                    disabled={!!location.state}
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
                    disabled={!!location.state}
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
                    disabled={!!location.state}
                />
                {fullNameError && <div className="text-danger">{fullNameError}</div>}
            </div>
            <div className="register-form-group">
                <input
                    type="checkbox"
                    id="terms"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                />
                <label htmlFor="terms" className="ml-2">
                    I accept the <button className="link-button" onClick={handleShowTermsModal}>Terms and Policy</button>
                </label>
                {termsError && <div className="text-danger">{termsError}</div>}
            </div>
            <div className="text-center mt-4">
                <button className="btn btn-primary register-btn" onClick={handleRegister} disabled={loading}>
                    {loading ? <Spinner animation="border" size="sm" /> : 'Register'}
                </button>
            </div>
            <div className="register-link">
                <small>
                    <a href="/login" className="text-muted">Already have an account? Login</a>
                </small>
            </div>

            <div className="lecturer-contact">
                <small>
                    Lecturer? <a href={`mailto:${OurMail}`}>Contact us</a>
                </small>
            </div>

            {/* Terms and Policy Modal */}
            <Modal show={showTermsModal} onHide={handleCloseTermsModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Terms and Policy</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>By accessing and using ScholarShareNet, you accept and agree to be bound by the terms and conditions outlined below. If you do not agree with these terms, please do not use the platform.</p>
                    <h5>User Accounts</h5>
                    <p>To access certain features of the platform, users must register and create an account. Users are responsible for maintaining the confidentiality of their login credentials and for all activities that occur under their accounts.</p>
                    <h5>User-Generated Content</h5>
                    <p>Users can upload, share, and download study materials. By submitting content, users affirm that they own the rights or have the necessary permissions for the materials shared.</p>
                    <h5>Accuracy of Content</h5>
                    <p>ScholarShareNet strives to maintain a high-quality platform; however, we do not guarantee the accuracy, reliability, or completeness of the content uploaded by users.</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseTermsModal}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default RegisterComponent;
