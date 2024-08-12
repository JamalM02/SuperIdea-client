import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

function VerifyComponent({ email, verificationCode }) {
    const [userInputCode, setUserInputCode] = useState('');
    const navigate = useNavigate();

    const handleVerification = () => {
        if (userInputCode === verificationCode) {
            toast.success('Verification successful!');
            navigate('/login');
        } else {
            toast.error('Invalid verification code');
        }
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
            <button className="btn btn-primary verify-btn" onClick={handleVerification}>
                Verify
            </button>
        </div>
    );
}

export default VerifyComponent;
