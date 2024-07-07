import React, { useState, useEffect } from 'react';
import { fetchIdeas, createIdea, likeIdea } from '../../services/api.service';
import { toast } from 'react-toastify';
import { Modal, Button, Tooltip, Overlay } from 'react-bootstrap';
import './Ideas.component.css';
import '../Style/ModalStyle.component.css';
import { formatDistanceToNow } from 'date-fns/esm';

const DESCRIPTION_CHARACTER_LIMIT = 300;
const TITLE_CHARACTER_LIMIT = 30;

function Ideas() {
    const [ideas, setIdeas] = useState([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showLikes, setShowLikes] = useState(null);
    const [target, setTarget] = useState(null);
    const [remainingTitleChars, setRemainingTitleChars] = useState(TITLE_CHARACTER_LIMIT);
    const [remainingDescriptionChars, setRemainingDescriptionChars] = useState(DESCRIPTION_CHARACTER_LIMIT);

    useEffect(() => {
        const fetchAllIdeas = async () => {
            let ideasList = await fetchIdeas();
            ideasList = ideasList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setIdeas(ideasList);
        };

        fetchAllIdeas();
    }, []);

    const handleAddIdea = async () => {
        if (title.trim() === '' || description.trim() === '') {
            alert('Title and description are required');
            return;
        }

        const user = JSON.parse(localStorage.getItem('user'));

        const newIdea = {
            title,
            description,
            user,
        };

        try {
            await createIdea(newIdea);
            resetForm();
            setShowModal(false);
            let updatedIdeas = await fetchIdeas();
            updatedIdeas = updatedIdeas.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setIdeas(updatedIdeas);
            toast.success('New idea added successfully!');
        } catch (error) {
            console.error('Error creating idea:', error);
            alert('Failed to create idea');
        }
    };

    const handleTitleChange = (e) => {
        const newTitle = e.target.value;
        if (newTitle.length <= TITLE_CHARACTER_LIMIT) {
            setTitle(newTitle);
            setRemainingTitleChars(TITLE_CHARACTER_LIMIT - newTitle.length);
        }
    };

    const handleDescriptionChange = (e) => {
        const newDescription = e.target.value;
        if (newDescription.length <= DESCRIPTION_CHARACTER_LIMIT) {
            setDescription(newDescription);
            setRemainingDescriptionChars(DESCRIPTION_CHARACTER_LIMIT - newDescription.length);
        }
    };

    const handleLike = async (ideaId) => {
        const user = JSON.parse(localStorage.getItem('user'));
        try {
            const updatedIdea = await likeIdea(ideaId, user._id);
            setIdeas(ideas.map(idea => idea._id === ideaId ? updatedIdea : idea));
        } catch (error) {
            console.error('Error liking idea:', error);
            alert('Failed to like/unlike idea');
        }
    };

    const handleShowLikes = (event, likes) => {
        setShowLikes(likes);
        setTarget(event.target);
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setRemainingTitleChars(TITLE_CHARACTER_LIMIT);
        setRemainingDescriptionChars(DESCRIPTION_CHARACTER_LIMIT);
    };

    const handleCloseModal = () => {
        resetForm();
        setShowModal(false);
    };

    return (
        <div className="ideas-container">
            <div className="page-title-container">
                <div className="title-subtitle-container">
                    <div className="page-title">Ideas</div>
                    <p className="page-subtitle">Share between all the students and teachers and bring new ideas to life!</p>
                </div>
                <Button onClick={() => setShowModal(true)} className="create-idea-button">
                    Create New Idea
                </Button>
            </div>

            <Modal show={showModal} onHide={handleCloseModal} centered className="custom-modal">
                <Modal.Header closeButton>
                    <Modal.Title>Create New Idea</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="idea-form">
                        <input
                            type="text"
                            placeholder="Subject"
                            value={title}
                            onChange={handleTitleChange}
                            className="form-control mb-2"
                        />
                        <small className="char-reminder">
                            {remainingDescriptionChars} characters remaining
                        </small>
                        <textarea
                            placeholder="Description"
                            value={description}
                            onChange={handleDescriptionChange}
                            className="form-control mb-2"
                            rows="5"
                        />
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal}>
                        Cancel
                    </Button>
                    <Button variant="success" onClick={handleAddIdea}>
                        Submit
                    </Button>
                </Modal.Footer>
            </Modal>

            <div className="ideas-list">
                {ideas.length > 0 ? (
                    ideas.map((idea) => (
                        <div key={idea._id} className="idea-bubble">
                            <div className="creator">{`${idea.user.fullName} (${idea.user.type})`}
                                <span className="post-time">
                                    {` - ${formatDistanceToNow(new Date(idea.createdAt))} ago`}
                                </span>
                            </div>
                            <div className="description">{idea.description}</div>
                            <div className="actions">
                                <Button onClick={() => handleLike(idea._id)} variant="outline-success">
                                    {idea.likes.some(like => like._id === JSON.parse(localStorage.getItem('user'))._id) ? 'Unlike' : 'Like'}
                                </Button>
                                <span
                                    className="likes-counter"
                                    onClick={(e) => handleShowLikes(e, idea.likes)}
                                >
                                    {idea.likes.length}
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <h1 className="no-ideas">No ideas yet</h1>
                )}
            </div>

            {showLikes && (
                <Modal show={true} onHide={() => setShowLikes(null)} centered className="custom-modal">
                    <Modal.Header closeButton>
                        <Modal.Title>Likes</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {showLikes.length > 0 ? (
                            <ul>
                                {showLikes.map(like => (
                                    <li key={like._id}>
                                        {like.fullName}
                                        <span className="like-user-type">({like.type})</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <span>No likes yet</span>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowLikes(null)}>
                            Close
                        </Button>
                    </Modal.Footer>
                </Modal>
            )}
        </div>
    );
}

export default Ideas;