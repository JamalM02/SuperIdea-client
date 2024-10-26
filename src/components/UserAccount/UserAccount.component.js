import React, {useEffect, useState} from 'react';
import {Button, Modal, Spinner} from 'react-bootstrap';
import {toast} from 'react-toastify';
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
import {Link} from 'react-router-dom';
import {io} from 'socket.io-client';
import './UserAccount.component.css';
import '../Style/ModalStyle.component.css';
import { FaApple, FaGooglePlay } from "react-icons/fa";
const IdeasScoreWeight = 40;
let LikesScoreWeight = 20;
let AvrRatingScoreWeight = 40;

const socket = io(process.env.REACT_APP_API_URL_DEV);
const ServiceName = 'ScholarShareNet';

const retry = async (fn, retriesLeft = 5, interval = 1000) => {
    try {
        return await fn();
    } catch (error) {
        if (retriesLeft === 1) throw error;
        await new Promise((r) => setTimeout(r, interval));
        return retry(fn, retriesLeft - 1, interval);
    }
};

function UserAccountComponent({user}) {
    const [achievements, setAchievements] = useState(null);
    const [ideas, setIdeas] = useState([]);
    const [report, setReport] = useState(null);
    const [showLikes, setShowLikes] = useState(null);
    const [showRatings, setShowRatings] = useState(null); // State to manage the ratings modal
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
    const [cooldownTimer, setCooldownTimer] = useState(0); // Timer state
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);
    const [secret, setSecretKey] = useState('');
    const [showScoreInfoModal, setShowScoreInfoModal] = useState(false); // Modal state

    // Loading states for actions
    const [loadingGenerate2FA, setLoadingGenerate2FA] = useState(false);
    const [loadingCopySecret, setLoadingCopySecret] = useState(false);
    const [loadingValidate2FA, setLoadingValidate2FA] = useState(false);
    const [loadingDisable2FA, setLoadingDisable2FA] = useState(false);

    useEffect(() => {
        if (user) {
            fetch2FAStatus(user._id);
            fetchAchievements(user._id);
            fetchUserIdeas(user._id);
        }
        fetchReport();
        fetchTopContributorsData();

        socket.on('likeIdea', () => {
            if (user) {
                fetchAchievements(user._id);
            }
        });

        return () => {
            socket.off('likeIdea');
        };
    }, [user]);

    useEffect(() => {
        let timer;
        if (cooldown && cooldownTimer > 0) {
            timer = setTimeout(() => {
                setCooldownTimer(cooldownTimer - 1);
            }, 1000);
        } else if (cooldown && cooldownTimer === 0) {
            setCooldown(false);
        }
        return () => clearTimeout(timer);
    }, [cooldown, cooldownTimer]);

    const fetch2FAStatus = async (userId) => {
        try {
            const status = await check2FAStatus(userId);
            setIs2FAEnabled(status);
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
            const response = await retry(fetchTopContributors); // Already sorted by backend
            setTopContributors(response); // Just set response directly
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

    const handleShowRatings = (ratings) => {
        setShowRatings(ratings);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setShowLikes(null);
        setShowRatings(null);
    };

    const handleGenerate2FA = async () => {
    setLoadingGenerate2FA(true);
        try {
            const response = await generate2FA(user._id, password);
            setQrCode(response.qrCode);
            setSecretKey(response.secret);
            setCooldown(true);
        setCooldownTimer(60); // 60 seconds cooldown
        } catch (error) {
            setCooldown(false);
            if (error.response && error.response.status === 429) {
            toast.error('Too many attempts. Please try again later.');
            }else if (error.response && error.response.data.message === 'Invalid password') {
                toast.error('Invalid password. Please try again.');
        } else if (error.response && error.response.data.message === '2FA is already enabled. Please disable it first if you want to reset.') {
            toast.error('2FA is already enabled. Disable it first to reset.');
            } else {
            toast.error('Failed to generate 2FA QR code. Please try again.');
            }
        } finally {
        setLoadingGenerate2FA(false);
        }
    };

    const handleCopyToClipboard = () => {
        setLoadingCopySecret(true); // Start loading
        navigator.clipboard.writeText(secret)
            .then(() => {
                toast.success('Secret key copied to clipboard.');
            })
            .catch(() => {
                toast.error('Failed to copy the secret key. Please try again.');
            })
            .finally(() => {
                setLoadingCopySecret(false); // Stop loading
            });
    };

    const handleValidate2FA = async () => {
    setLoadingValidate2FA(true);
        try {
            const response = await verify2FA(user._id, token);
            if (response.success) {
                await handleEnable2FA();
                setIs2FAEnabled(true);
            } else {
                toast.error('Invalid 2FA token. Please try again.');
            }
        } catch (error) {
        if (error.response && error.response.data.message) {
            toast.error(`Failed to validate 2FA token: ${error.response.data.message}`);
        } else {
            toast.error('Failed to validate 2FA token. Please try again.');
        }
        } finally {
        setLoadingValidate2FA(false);
        }
    };
    const handleEnable2FA = async () => {
        try {
            await enable2FA(user._id, password, token);
            setIs2FAEnabled(true);
            toast.success('2FA has been enabled successfully.');
            handleClose2FAModal();
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
        setLoadingDisable2FA(true); // Start loading
        try {
            const response = await disable2FA(user._id, password, token);
            if (response.message === '2FA disabled') {
                setIs2FAEnabled(false);
                toast.success('2FA has been disabled successfully.');
                handleClose2FAModal();
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
        } finally {
            setLoadingDisable2FA(false); // Stop loading
        }
    };

    const handleClose2FAModal = () => {
        setShow2FAModal(false);
        setPassword('');
        setToken('');
        setQrCode('');
        setCooldown(false);
    };

    const handleShowScoreInfoModal = () => setShowScoreInfoModal(true);
    const handleCloseScoreInfoModal = () => setShowScoreInfoModal(false);


    return (
        <div className="user-account-wrapper">
            <div className="user-page-title-container">
                <div className="user-title-subtitle-container">
                    <div className="user-page-title">
                        {user ? (
                            <>
                                {user.topContributor === true && <span role="img" aria-label="trophy">🏆</span>}
                                {user.fullName}
                            </>
                        ) : 'Loading...'}
                    </div>
                    <div className="user-page-subtitle">{user ? user.email : 'Loading...'}</div>
                    <Button
                        className="button-2FA"
                        onClick={() => setShow2FAModal(true)}
                        style={{
                            backgroundColor: is2FAEnabled ? 'red' : 'green',
                            color: 'white',
                            fontWeight: 'bold'
                        }}
                    >
                        {is2FAEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                        <p style={{fontSize: '10px', margin: '0'}}>Two-Factor Authentication</p>
                    </Button>

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
                            Score: {achievements.score}
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
                                <th>Average Rating</th>
                            </tr>
                            </thead>
                            <tbody>
                            {ideas.map((idea) => (
                                <tr key={idea._id}>
                                    <td className="subject-field">{idea.title}</td>
                                    <td
                                        className="like-click"
                                        onClick={() => handleShowLikes(idea.likes)}
                                    >
                                        {idea.likesCount}
                                    </td>
                                    <td
                                        className="rating-click"
                                        onClick={() => handleShowRatings(idea.ratings)}
                                    >
                                        {idea.ratingCount > 0
                                            ? (idea.totalRatings / idea.ratingCount).toFixed(1)
                                            : 'No ratings'}
                                    </td>

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
                Weekly top contributors based on their score.
                <a href="#" onClick={handleShowScoreInfoModal}>Learn more</a>
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
                                <th>Score</th>
                            </tr>
                            </thead>
                            <tbody>
                            {topContributors.map(contributor => (
                                <tr key={contributor._id}>
                                    <td>{contributor.fullName}</td>
                                    <td>{contributor.type}</td>
                                    <td>{contributor.totalLikes}</td>
                                    <td>{contributor.totalIdeas}</td>
                                    <td>{contributor.score}</td>
                                    {/* Display avgRating */}
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
                    <Modal.Title>{showLikes ? 'Likes' : 'Ratings'}</Modal.Title>
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
                    ) : showRatings && showRatings.length > 0 ? (
                        <ul>
                            {showRatings.map((rating) => (
                                <li key={rating.userId._id}>
                                    ★ {rating.userId.fullName} - Rated: {rating.rating}
                                </li>
                            ))}
                        </ul>

                    ) : (
                        <span>No {showLikes ? 'likes' : 'ratings'} yet</span>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal scrollable={true} show={show2FAModal} centered={true} onHide={handleClose2FAModal}>
                <Modal.Header closeButton>
                    <Modal.Title>{is2FAEnabled ? 'Disable 2FA' : 'Enable 2FA'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <input
                        type="password"
                        placeholder="Enter your password"
                        style={{marginBottom: '10px'}}
                        value={password}
                        required
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    {is2FAEnabled ? (
                        <>
                            <br/>
                            <input
                                type="text"
                                placeholder="Enter 2FA token"
                                value={token}
                                required
                                onChange={(e) => setToken(e.target.value)}
                            />
                            <br/>
                            <Button style={{margin: '10px 0'}} variant="danger"
                                    onClick={handleDisable2FA}
                                    disabled={!password || !token || loadingDisable2FA}
                            >
                                {loadingDisable2FA ? <Spinner animation="border" size="sm"/> : 'Disable 2FA'}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button style={{margin: 5}} variant="primary"
                                    onClick={handleGenerate2FA} disabled={!password || cooldown || loadingGenerate2FA}>
                                {loadingGenerate2FA ? <Spinner animation="border"
                                                               size="sm"/> : (cooldown ? `Cooldown ${cooldownTimer}s` : 'Generate QR Code')}
                            </Button>
                            {qrCode && (
                                <>
                                    <img src={qrCode} alt="QR Code" style={{width: '200px', marginTop: '10px'}}/><br/>
                                    <a>Service: <strong>{ServiceName}</strong></a><br/>
                                    <Button onClick={handleCopyToClipboard} disabled={loadingCopySecret}>
                                        {loadingCopySecret ?
                                            <Spinner animation="border" size="sm"/> : 'Copy Secret Key'}
                                    </Button>
                                    <p><strong>NOTE: Click the button to Copy the key and paste it into your
                                        authenticator app manually.</strong></p>
                                    <input
                                        type="text"
                                        placeholder="Enter 2FA token"
                                        value={token}
                                        required
                                        onChange={(e) => setToken(e.target.value)}
                                    />
                                    <Button style={{margin: '10px 10px'}} variant="success"
                                            onClick={handleValidate2FA}
                                            disabled={!password || !token || loadingValidate2FA}
                                    >
                                        {loadingValidate2FA ? <Spinner animation="border" size="sm"/> : 'Enable 2FA'}
                                    </Button>
                                    <br/>
                                    <p1>For Example:</p1>
                                    <br/>
                                    <div style={{display: 'flex', gap: '20px', alignItems: 'center'}}>
                                        <p2 style={{fontWeight: "bold"}}>Download Google Authenticator:</p2>
                                        <div style={{textAlign: 'center'}}>
                                            <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2&hl=en&gl=US"
                                               target="_blank" rel="noopener noreferrer"
                                               title="Download Google Authenticator for Android">
                                                <FaGooglePlay style={{fontSize: '30px'}}/>
                                            </a>
                                        </div>
                                        <div style={{textAlign: 'center'}}>
                                            <a href="https://apps.apple.com/us/app/google-authenticator/id388497605"
                                               target="_blank" rel="noopener noreferrer"
                                               title="Download Google Authenticator for iOS">
                                                <FaApple style={{fontSize: '35px'}}/>
                                            </a>
                                        </div>
                                    </div>

                                    <div style={{marginTop: 10, display: 'flex', gap: '20px', alignItems: 'center'}}>
                                        <p3 style={{fontWeight: "bold"}}>Download Microsoft Authenticator:</p3>
                                        <div style={{textAlign: 'center'}}>
                                            <a href="https://play.google.com/store/apps/details?id=com.azure.authenticator&hl=en&gl=US"
                                               target="_blank" rel="noopener noreferrer"
                                               title="Download Microsoft Authenticator for Android">
                                                <FaGooglePlay style={{fontSize: '30px'}}/>
                                            </a>
                                        </div>
                                        <div style={{textAlign: 'center'}}>
                                            <a href="https://apps.apple.com/us/app/microsoft-authenticator/id983156458"
                                               target="_blank" rel="noopener noreferrer"
                                               title="Download Microsoft Authenticator for iOS">
                                                <FaApple style={{fontSize: '35px'}}/>
                                            </a>
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </Modal.Body>
            </Modal>
            {/* Score Information Modal */}
            <Modal show={showScoreInfoModal} onHide={handleCloseScoreInfoModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Score Calculation Information</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>The top contributors list is updated weekly, highlighting the top 3 users based on their score.</p>
                    <p><strong>Score Calculation:</strong></p>
                    <ul>
                        <li><strong>Ideas:</strong> {IdeasScoreWeight}% weight</li>
                        <li><strong>Likes:</strong> {LikesScoreWeight}% weight</li>
                        <li><strong>Average Rating:</strong> {AvrRatingScoreWeight}% weight</li>
                    </ul>
                    <p>Each user's score is recalculated every week, considering their total ideas, likes, and average rating.</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseScoreInfoModal}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default UserAccountComponent;
