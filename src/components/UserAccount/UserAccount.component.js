import React, { useState, useEffect } from 'react';
import { getUserAchievements, getUserIdeas, getReport } from '../../services/api.service';
import { Modal, Button } from 'react-bootstrap';
import './UserAccount.component.css';
import '../Style/ModalStyle.component.css';
import { Link } from "react-router-dom";

// Retry function
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

    const [loadingAchievements, setLoadingAchievements] = useState(false);
    const [errorAchievements, setErrorAchievements] = useState(null);

    const [loadingIdeas, setLoadingIdeas] = useState(false);
    const [errorIdeas, setErrorIdeas] = useState(null);

    const [loadingReport, setLoadingReport] = useState(false);
    const [errorReport, setErrorReport] = useState(null);

    useEffect(() => {
        if (user) {
            fetchAchievements(user._id);
            fetchUserIdeas(user._id);
        }
        fetchReport();
    }, [user]);

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

    const handleShowLikes = (likes) => {
        setShowLikes(likes);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setShowLikes(null);
    };

    return (
        <div className="user-account-wrapper">
            <div className="user-page-title-container">
                <div className="user-title-subtitle-container">
                    <div className="user-page-title">{user ? user.fullName : 'Loading...'}</div>
                    <div className="user-page-subtitle">{user ? user.email : 'Loading...'}</div>
                </div>
                {user && (
                    <Link to="/ideas">
                        <div className="account-buttons">
                            <Button className="ideas-link-button">
                                Lets add some ideas
                            </Button>
                        </div>
                    </Link>
                )}
            </div>

            <div>
                {loadingAchievements ? (
                    <p className="loading">Loading achievements...</p>
                ) : errorAchievements ? (
                    <p className="error">{errorAchievements}</p>
                ) : achievements ? (
                    <ul className="user-achievements-list">
                        <li>Ideas submitted: {achievements.totalIdeas}</li>
                        <li>Ideas liked: {achievements.totalLikes}</li>
                        <li>Top contributor: {achievements.topContributor ? 'Yes' : 'No'}</li>
                    </ul>
                ) : null}
            </div>

            <div className="user-ideas">
                <div className="user-ideas-title">Your Ideas</div>
                <div className="user-ideas-table-wrapper">
                    {loadingIdeas ? (
                        <p className="loading">Loading ideas...</p>
                    ) : errorIdeas ? (
                        <p className="error">{errorIdeas}</p>
                    ) : ideas.length > 0 ? (
                        <table className="user-ideas-table">
                            <thead className="user-ideas-thead">
                            <tr>
                                <th>Title</th>
                                <th>Likes Count</th>
                            </tr>
                            </thead>
                            <tbody>
                            {ideas.map((idea) => (
                                <tr key={idea._id}>
                                    <td className="subject-field">{idea.title}</td>
                                    <td className="like-click" onClick={() => handleShowLikes(idea.likes)}
                                        style={{ cursor: 'pointer' }}>
                                        {idea.likesCount}
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
                                <th>Ideas Count</th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr>
                                <td>Students</td>
                                <td>{report.totalStudentIdeas}</td>
                            </tr>
                            <tr>
                                <td>Teachers</td>
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
        </div>
    );
}

export default UserAccountComponent;
