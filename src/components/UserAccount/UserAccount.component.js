import React, { useState, useEffect } from 'react';
import { getUserAchievements, getUserIdeas, getReport } from '../../services/api.service';
import { Modal, Button } from 'react-bootstrap';
import './UserAccount.component.css';
import '../Style/ModalStyle.component.css';

function UserAccountComponent({ user }) {
    const [achievements, setAchievements] = useState(null);
    const [ideas, setIdeas] = useState([]);
    const [showLikes, setShowLikes] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [report, setReport] = useState(null);

    useEffect(() => {
        if (user) {
            fetchAchievements(user._id);
            fetchUserIdeas(user._id);
        }
        fetchReport();
    }, [user]);

    const fetchAchievements = async (userId) => {
        try {
            const response = await getUserAchievements(userId);
            setAchievements(response);
        } catch (error) {
            console.error('Failed to fetch achievements', error);
        }
    };

    const fetchUserIdeas = async (userId) => {
        try {
            const response = await getUserIdeas(userId);
            setIdeas(response);
        } catch (error) {
            console.error('Failed to fetch user ideas', error);
        }
    };

    const fetchReport = async () => {
        try {
            const response = await getReport();
            setReport(response);
        } catch (error) {
            console.error('Failed to fetch report', error);
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
                    <p className="user-page-subtitle">{user ? user.email : 'Loading...'}</p>
                </div>
                <div className="account-management-buttons">
                    <button className="edit-profile-button">Edit Profile</button>
                </div>
            </div>
            {achievements ? (
                <div className="user-achievements">
                    <div className="user-achievements-title">Achievements</div>
                    <ul className="user-achievements-list">
                        <li>Ideas submitted: {achievements.totalIdeas}</li>
                        <li>Ideas liked: {achievements.totalLikes}</li>
                        <li>Top contributor: {achievements.topContributor ? 'Yes' : 'No'}</li>
                    </ul>
                </div>
            ) : (
                <p>Loading achievements...</p>
            )}
            <div className="user-ideas">
                <div className="user-ideas-title">Your Ideas</div>
                <div className="user-ideas-table-wrapper">
                    {ideas.length > 0 ? (
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
                                    <td className="like-click" onClick={() => handleShowLikes(idea.likes)} style={{ cursor: 'pointer' }}>
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
            {report ? (
                <div className="user-reports">
                    <div className="user-reports-title">Reports</div>
                    <div className="user-reports-table-wrapper">
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
                                <td>{report.studentIdeasCount}</td>
                            </tr>
                            <tr>
                                <td>Teachers</td>
                                <td>{report.teacherIdeasCount}</td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <p>Loading report...</p>
            )}
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
