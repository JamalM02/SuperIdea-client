import React, {useEffect, useState} from 'react';
import {
    check2FAStatus,
    disable2FA,
    enable2FA,
    fetchTopContributors,
    generate2FA,
    getReport,
    getUserAchievements,
    getUserIdeas,
    verify2FA
} from '../../services/api.service';
import {Button, Modal} from 'react-bootstrap';
import './UserAccount.component.css';
import '../Style/ModalStyle.component.css';
import {Link} from "react-router-dom";
import {io} from 'socket.io-client';
import {toast} from "react-toastify";

const socket = io(process.env.REACT_APP_API_URL_DEV);

const retry = async (fn, retriesLeft = 5, interval = 1000) => {
    try {
        return await fn();
    } catch (error) {
        if (retriesLeft === 1) throw error;
        await new Promise(r => setTimeout(r, interval));
        return retry(fn, retriesLeft - 1, interval);
    }
};

function UserAccountComponent({ user }) {
    const [achievements, setAchievements] = useState(null);
    const [ideas, setIdeas] = useState([]);
    const [report, setReport] = useState(null);
    const [showLikes, setShowLikes] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [topContributors, setTopContributors] = useState([]);
    const [loadingTopContributors, setLoadingTopContributors] = useState(false);
    const [errorTopContributors, setErrorTopContributors] = useState(null);

    const [loadingAchievements, setLoadingAchievements] = useState(false);
    const [errorAchievements, setErrorAchievements] = useState(null);

    const [loadingIdeas, setLoadingIdeas] = useState(false);
    const [errorIdeas, setErrorIdeas] = useState(null);

    const [loadingReport, setLoadingReport] = useState(false);
    const [errorReport, setErrorReport] = useState(null);

    const [show2FAModal, setShow2FAModal] = useState(false);
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [password, setPassword] = useState('');
    const [token, setToken] = useState('');
    const [qrCode, setQrCode] = useState('');
    const [cooldown, setCooldown] = useState(false);
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);

    const [otpAuthUrl, setOtpAuthUrl] = useState('');

    useEffect(() => {
        if (user) {
            fetch2FAStatus(user._id);  // Fetch the 2FA status on component load
            fetchAchievements(user._id);
            fetchUserIdeas(user._id);
        }
        fetchReport();
        fetchTopContributorsData();

        // Set up socket listener for like events
        socket.on('likeIdea', () => {
            if (user) {
                fetchAchievements(user._id);
            }
        });

        return () => {
            socket.off('likeIdea');
        };
    }, [user]);

    const fetch2FAStatus = async (userId) => {
        try {
            const status = await check2FAStatus(userId);  // Fetch the status from the API
            setIs2FAEnabled(status);  // Update the state based on the fetched status
        } catch (error) {
            console.error('Failed to check 2FA status:', error);
        }
    };

    const fetchAchievements = async (userId) => {
        setLoadingAchievements(true);
        setErrorAchievements(null);
        try {
            const response = await retry(() => getUserAchievements(userId));
            setAchievements(response);
        } catch (error) {
            console.error('Failed to fetch achievements', error);
            setErrorAchievements('Failed to load achievements');
        } finally {
            setLoadingAchievements(false);
        }
    };

    const fetchUserIdeas = async (userId) => {
        setLoadingIdeas(true);
        setErrorIdeas(null);
        try {
            const response = await retry(() => getUserIdeas(userId));
            setIdeas(response);
        } catch (error) {
            console.error('Failed to fetch user ideas', error);
            setErrorIdeas('Failed to load ideas');
        } finally {
            setLoadingIdeas(false);
        }
    };

    const fetchReport = async () => {
        setLoadingReport(true);
        setErrorReport(null);
        try {
            const response = await retry(getReport);
            setReport(response);
        } catch (error) {
            console.error('Failed to fetch report', error);
            setErrorReport('Failed to load report');
        } finally {
            setLoadingReport(false);
        }
    };

    const fetchTopContributorsData = async () => {
        setLoadingTopContributors(true);
        setErrorTopContributors(null);
        try {
            const response = await retry(fetchTopContributors);
            setTopContributors(response.filter(contributor => contributor.totalIdeas > 0));
        } catch (error) {
            console.error('Failed to fetch top contributors', error);
            setErrorTopContributors('Failed to load top contributors');
        } finally {
            setLoadingTopContributors(false);
        }
    };

    const handleShowLikes = (likes) => {
        setShowLikes(likes);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setShowLikes(null);
    };

    const handleGenerate2FA = async () => {
        try {
            const response = await generate2FA(user._id, password);
            setQrCode(response.qrCode);
        setOtpAuthUrl(response.otpAuthUrl); // Save the otpAuthUrl
            toast.success('QR code generated successfully.');
        } catch (error) {
            setCooldown(false); // Stop cooldown on error
            if (error.response && error.response.status === 429) {
                toast.error(error.response.data.message); // Cooldown message from the server
            } else if (error.response && error.response.status === 400) {
            toast.error(error.response.data.message); // Invalid password or 2FA already enabled
            } else {
                console.error('Error generating 2FA QR code:', error);
                toast.error('Failed to generate QR code. Please try again.');
            }
        }
    };

    const handleValidate2FA = async () => {
        console.log('Validating 2FA with:', { userId: user._id, token });
        try {
            const response = await verify2FA(user._id, token);
            if (response.success) {
                await handleEnable2FA();  // Enable 2FA only if validation succeeds
                setIs2FAEnabled(true);  // Update state immediately
            } else {
                console.error('Invalid 2FA token');
                toast.error('Invalid 2FA token. Please try again.');
            }
        } catch (error) {
            console.error('Error validating 2FA token:', error);
            toast.error('Failed to validate 2FA token. Please try again.');
        }
    };

    const handleEnable2FA = async () => {
        try {
            await enable2FA(user._id, password, token);
            setIs2FAEnabled(true);  // Update state immediately
            toast.success('2FA has been enabled successfully.');
            handleClose2FAModal(); // Close the modal
        } catch (error) {
            console.error('Error enabling 2FA:', error.message, error.response ? error.response.data : '');
            if (error.response && error.response.data.message === 'Invalid password') {
                toast.error('Invalid password. Please try again.');
            } else if (error.response && error.response.data.message === 'Invalid 2FA token') {
                toast.error('Invalid 2FA token. Please try again.');
            } else {
                toast.error('Failed to enable 2FA. Please check your credentials and try again.');
            }
        }
    };

    const handleDisable2FA = async () => {
        try {
            const response = await disable2FA(user._id, password, token);

            if (response.message === '2FA disabled') {
                setIs2FAEnabled(false);  // Update state immediately
                toast.success('2FA has been disabled successfully.');
                handleClose2FAModal(); // Close the modal
            } else {
                if (response.message === 'Invalid password') {
                    toast.error('Invalid password. Please try again.');
                } else if (response.message === 'Invalid 2FA token') {
                    toast.error('Invalid 2FA token. Please try again.');
                } else {
                    toast.error('Failed to disable 2FA. Please check your credentials and try again.');
                }
            }
        } catch (error) {
            console.error('Error disabling 2FA:', error);
            if (error.response && error.response.data.message === 'Invalid password') {
                toast.error('Invalid password. Please try again.');
            } else if (error.response && error.response.data.message === 'Invalid 2FA token') {
                toast.error('Invalid 2FA token. Please try again.');
            } else {
                toast.error('Failed to disable 2FA. Please try again.');
            }
        }
    };

    const handleClose2FAModal = () => {
        setShow2FAModal(false);
        setPassword(''); // Clear the password input
        setToken(''); // Clear the token input
        setQrCode(''); // Clear the QR code
        setCooldown(false); // Stop cooldown when closing the modal
    };

    return (
        <div className="user-account-wrapper">
            <div className="user-page-title-container">
                <div className="user-title-subtitle-container">
                    <div className="user-page-title">
                        {user ? (
                            <>
                                {user.topContributor===true && <span role="img" aria-label="trophy">🏆</span>}
                                {user.fullName}
                            </>
                        ) : 'Loading...'}
                        <Button
                            className="button-2FA"
                            onClick={() => setShow2FAModal(true)}
                            style={{ backgroundColor: is2FAEnabled ? 'red' : 'green', color: 'white', fontWeight: 'bold' }}
                        >
                            {is2FAEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                        </Button>
                    </div>
                    <div className="user-page-subtitle">{user ? user.email : 'Loading...'}</div>
                </div>
                {user && (
                    <Link to="/ideas">
                        <div className="account-buttons">
                            <Button className="ideas-link-button">
                                Lets add! 📚
                            </Button>
                        </div>
                    </Link>
                )}
            </div>

            <div className="user-ideas">
                <div className="user-ideas-title">My Posts
                    {loadingAchievements ? (
                        <p className="loading">Loading achievements...</p>
                    ) : errorAchievements ? (
                        <p className="error">{errorAchievements}</p>
                    ) : achievements ? (
                        <p className="user-achievements">
                            Posts: {achievements.totalIdeas}  likes: {achievements.totalLikes}
                        </p>
                    ) : null}
                </div>
                <div className="user-ideas-table-wrapper">
                    {loadingIdeas ? (
                        <p className="loading">Loading posts...</p>
                    ) : errorIdeas ? (
                        <p className="error">{errorIdeas}</p>
                    ) : ideas.length > 0 ? (
                        <table className="user-ideas-table">
                            <thead className="user-ideas-thead">
                            <tr>
                                <th>Post's Subject</th>
                                <th>Likes</th>
                            </tr>
                            </thead>
                            <tbody>
                            {ideas.map((idea) => (
                                <tr key={idea._id}>
                                    <td className="subject-field">{idea.title} {idea.user && idea.user.topContributor ? '🏆' : ''}</td>
                                    <td className="like-click" onClick={() => handleShowLikes(idea.likes)}
                                        style={{cursor: 'pointer'}}>{idea.likesCount}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>No ideas to display.</p>
                    )}
                </div>
            </div>

            <div className="top-contributors">
                <div className="user-reports-title">Top 3 Contributors 🏆</div>
                <div className="top-contributors-table-wrapper">
                    {loadingTopContributors ? (
                        <p className="loading">Loading top contributors...</p>
                    ) : errorTopContributors ? (
                        <p className="error">{errorTopContributors}</p>
                    ) : topContributors.length > 0 ? (
                        <table className="user-reports-table">
                            <thead className="user-reports-thead">
                            <tr>
                                <th>Name</th>
                                <th>Role</th>
                                <th>Likes</th>
                                <th>Posts</th>
                            </tr>
                            </thead>
                            <tbody>
                            {topContributors.map(contributor => (
                                <tr key={contributor._id}>
                                    <td>{contributor.fullName}</td>
                                    <td>{contributor.type}</td>
                                    <td>{contributor.totalLikes}</td>
                                    <td>{contributor.totalIdeas}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>No contributors to display.</p>
                    )}
                </div>
            </div>

            <div className="user-reports">
                <div className="user-reports-title">Reports</div>
                <div className="user-reports-table-wrapper">
                    {loadingReport ? (
                        <p className="loading">Loading report...</p>
                    ) : errorReport ? (
                        <p className="error">{errorReport}</p>
                    ) : report ? (
                        <table className="user-reports-table">
                            <thead className="user-reports-thead">
                            <tr>
                                <th>Role</th>
                                <th>Posts</th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr>
                                <td>Students</td>
                                <td>{report.totalStudentIdeas}</td>
                            </tr>
                            <tr>
                                <td>Lecturers</td>
                                <td>{report.totalTeacherIdeas}</td>
                            </tr>
                            </tbody>
                        </table>
                    ) : null}
                </div>
            </div>

            <Modal show={showModal} onHide={handleCloseModal} centered className="custom-modal">
                <Modal.Header closeButton>
                    <Modal.Title>Likes</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {showLikes && showLikes.length > 0 ? (
                        <ul>
                            {showLikes.map((like) => (
                                <li key={like._id}>
                                    {like.fullName} <span className="like-user-type">({like.type})</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <span>No likes yet</span>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal show={show2FAModal} centered={true} onHide={handleClose2FAModal}>
                <Modal.Header closeButton>
                    <Modal.Title>{is2FAEnabled ? 'Disable 2FA' : 'Enable 2FA'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <input
                        type="password"
                        placeholder="Enter your password"
                        style={{marginBottom: '10px', margin: '10px 0'}}
                        value={password}
                        required
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    {is2FAEnabled ? (
                        <>
                            <input
                                type="text"
                                style={{marginLeft: '10px',}}
                                placeholder="Enter 2FA token"
                                value={token}
                                required
                                onChange={(e) => setToken(e.target.value)}
                            />
                            <Button style={{margin: '10px 0'}} variant="danger"
                                onClick={handleDisable2FA}
                                disabled={!password || !token} // Disable the button if either input is empty
                            >
                                Disable 2FA
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button style={{margin: 10}} variant="primary"
                                    onClick={handleGenerate2FA} disabled={!password || cooldown}>
                                {cooldown ? 'Cooldown...' : 'Generate QR Code'}
                            </Button>
                            {qrCode && (
                                <>
                                    <img src={qrCode} alt="QR Code" style={{width: '300px', marginTop: '10px'}}/><br/>
                                    <a href={otpAuthUrl} target="_blank" rel="noopener noreferrer">
                                        Open in Google Authenticator or Microsoft Authenticator
                                    </a>
                                    <p>Please ensure you have either Google Authenticator or Microsoft Authenticator installed on your device.</p>
                                    <br/>
                                    <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2&hl=en&gl=US"
                                       target="_blank" rel="noopener noreferrer">
                                        Download Google Authenticator for Android
                                    </a>
                                    <br/>
                                    <a href="https://apps.apple.com/us/app/google-authenticator/id388497605"
                                       target="_blank" rel="noopener noreferrer">
                                        Download Google Authenticator for iOS
                                    </a>
                                    <br />
                                    <a href="https://play.google.com/store/apps/details?id=com.azure.authenticator&hl=en&gl=US"
                                        target="_blank" rel="noopener noreferrer">
                                        Download Microsoft Authenticator for Android
                                    </a>
                                    <br />
                                    <a href="https://apps.apple.com/us/app/microsoft-authenticator/id983156458"
                                        target="_blank" rel="noopener noreferrer">
                                        Download Microsoft Authenticator for iOS
                                    </a>
                                    <br />
                                    <input
                                        type="text"
                                        placeholder="Enter 2FA token"
                                        value={token}
                                        required
                                        onChange={(e) => setToken(e.target.value)}
                                    />
                                    <Button style={{margin: '10px 10px'}} variant="success"
                                            onClick={handleValidate2FA}
                                            disabled={!password || !token} // Disable the button if either input is empty
                                    >
                                        Enable 2FA
                                    </Button>
                                </>
                            )}
                        </>
                    )}
                </Modal.Body>
            </Modal>
        </div>
    );
}

export default UserAccountComponent;
