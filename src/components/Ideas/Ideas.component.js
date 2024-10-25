import React, {useState, useEffect, useRef} from 'react';
import {
    fetchIdeas,
    createIdea,
    likeIdea,
    fetchZipContents,
    fetchTopContributors,
    rateIdea
} from '../../services/api.service';
import {toast} from 'react-toastify';
import {Modal, Button, Tooltip, Overlay, Spinner} from 'react-bootstrap';
import './Ideas.component.css';
import '../Style/ModalStyle.component.css';
import {formatDistanceToNow} from 'date-fns/esm';
import FileUploadModal from './FileUploadModal/FileUploadModal';
import FileContentsModal from './FileUploadModal/FileContentsModal';

const DESCRIPTION_CHARACTER_LIMIT = 300;
const TITLE_CHARACTER_LIMIT = 20;
const MAX_FILE_COUNT = 9;

const retry = async (fn, retriesLeft = 5, interval = 1000) => {
    try {
        return await fn();
    } catch (error) {
        if (retriesLeft === 1) throw error;
        await new Promise(r => setTimeout(r, interval));
        return retry(fn, retriesLeft - 1, interval);
    }
};

const getFileIcon = (fileName) => {
    if (!fileName) return '/file-icon.png'; // Return a default icon if fileName is undefined

    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
        case 'pdf':
            return '/pdf-icon.png';
        case 'doc':
        case 'docx':
            return '/word-icon.png';
        case 'xls':
        case 'xlsx':
            return '/excel-icon.png';
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
            return '/image-icon.png';
        default:
            return '/file-icon.png';
    }
};

function Ideas() {
    const [ideas, setIdeas] = useState([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [files, setFiles] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showFileUploadModal, setShowFileUploadModal] = useState(false);
    const [showLikes, setShowLikes] = useState(null);
    const [target, setTarget] = useState(null);
    const [remainingTitleChars, setRemainingTitleChars] = useState(TITLE_CHARACTER_LIMIT);
    const [remainingDescriptionChars, setRemainingDescriptionChars] = useState(DESCRIPTION_CHARACTER_LIMIT);
    const [loadingIdeas, setLoadingIdeas] = useState(false);
    const [errorIdeas, setErrorIdeas] = useState(null);
    const [loadingLikes, setLoadingLikes] = useState({});
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [showFileContentsModal, setShowFileContentsModal] = useState(false);
    const [fileContents, setFileContents] = useState([]);
    const [showUploadedFilesModal, setShowUploadedFilesModal] = useState(false);
    const [topContributors, setTopContributors] = useState([]);
    const abortControllerRef = useRef(null);
    const [selectedRating, setSelectedRating] = useState({}); // To track selected rating for each idea


    useEffect(() => {
        const fetchAllIdeas = async () => {
            setLoadingIdeas(true);
            setErrorIdeas(null);
            try {
                let ideasList = await retry(fetchIdeas);
                ideasList = ideasList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setIdeas(ideasList);
            } catch (error) {
                console.error('Failed to fetch ideas', error);
                setErrorIdeas('Failed to load ideas');
            } finally {
                setLoadingIdeas(false);
            }
        };

        fetchAllIdeas();

        const fetchContributors = async () => {
            try {
                const contributors = await fetchTopContributors();
                setTopContributors(contributors.map(contributor => contributor._id)); // Store the contributor IDs
            } catch (error) {
                console.error('Error fetching top contributors', error);
            }
        };

        fetchContributors();
    }, []);

    const handleAddIdea = async () => {
        if (title.trim() === '' || description.trim() === '') {
            toast.warning('Title and description are required');
            return;
        }

        if (files.length === 0) {
            toast.warning('Please upload at least one file');
            return;
        }

        const user = JSON.parse(localStorage.getItem('user'));

        const newIdea = {
            title,
            description,
            user: {
                _id: user._id,
                fullName: user.fullName,
                type: user.type
            },
        };

        setLoadingSubmit(true);

        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        try {
            await createIdea(newIdea, files, signal);
            resetForm();
            setShowModal(false);
            let updatedIdeas = await retry(fetchIdeas);
            updatedIdeas = updatedIdeas.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setIdeas(updatedIdeas);
            toast.success('New idea added successfully!');
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Request was aborted');
            } else {
                console.error('Error creating idea:', error);
                toast.error('Failed to create idea');
            }
        } finally {
            setLoadingSubmit(false);
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

    const handleFileUpload = (uploadedFiles) => {
        const newFiles = [...files, ...uploadedFiles];
        if (newFiles.length > MAX_FILE_COUNT) {
            toast.error(`You can only upload up to ${MAX_FILE_COUNT} files.`);
        } else {
            setFiles(newFiles);
        }
        setShowFileUploadModal(false);
    };

    const handleFileRemove = (fileIndex) => {
        setFiles(files.filter((_, index) => index !== fileIndex));
    };

    const handleLike = async (ideaId) => {
        const user = JSON.parse(localStorage.getItem('user'));

        setLoadingLikes(prevLoadingLikes => ({...prevLoadingLikes, [ideaId]: true}));

        setIdeas(prevIdeas => {
            return prevIdeas.map(idea => {
                if (idea._id === ideaId) {
                    const alreadyLiked = idea.likes.some(like => like._id === user._id);
                    if (alreadyLiked) {
                        return {
                            ...idea,
                            likes: idea.likes.filter(like => like._id !== user._id),
                            likesCount: idea.likesCount - 1
                        };
                    } else {
                        return {
                            ...idea,
                            likes: [...idea.likes, {_id: user._id, fullName: user.fullName, type: user.type}],
                            likesCount: idea.likesCount + 1
                        };
                    }
                }
                return idea;
            });
        });

        try {
            const updatedIdea = await likeIdea(ideaId, user._id);
            setIdeas(prevIdeas => prevIdeas.map(idea => idea._id === ideaId ? updatedIdea : idea));
        } catch (error) {
            console.error('Error liking idea:', error);
            setIdeas(prevIdeas => {
                return prevIdeas.map(idea => {
                    if (idea._id === ideaId) {
                        const alreadyLiked = idea.likes.some(like => like._id === user._id);
                        if (alreadyLiked) {
                            return {
                                ...idea,
                                likes: idea.likes.filter(like => like._id !== user._id),
                                likesCount: idea.likesCount - 1
                            };
                        } else {
                            return {
                                ...idea,
                                likes: [...idea.likes, {_id: user._id, fullName: user.fullName, type: user.type}],
                                likesCount: idea.likesCount + 1
                            };
                        }
                    }
                    return idea;
                });
            });
            alert('Failed to like/unlike idea');
        } finally {
            setLoadingLikes(prevLoadingLikes => ({...prevLoadingLikes, [ideaId]: false}));
        }
    };

    const handleShowLikes = (event, likes) => {
        setShowLikes(likes);
        setTarget(event.target);
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setFiles([]);
        setRemainingTitleChars(TITLE_CHARACTER_LIMIT);
        setRemainingDescriptionChars(DESCRIPTION_CHARACTER_LIMIT);
    };

    const handleCloseModal = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        resetForm();
        setShowModal(false);
    };


    const handleDownload = (fileId) => {
        const apiUrl = process.env.REACT_APP_API_URL_PROD || process.env.REACT_APP_API_URL_DEV;
        if (!apiUrl) {
            console.error("REACT_APP_API_URL is not defined");
            return;
        }
        const url = `${apiUrl}/ideas/files/${fileId}`;
        window.open(url, '_blank');
    };

    const handleViewContents = async (fileId) => {
        try {
            const fileContents = await fetchZipContents(fileId);
            setFileContents(fileContents);
            setShowFileContentsModal(true);
        } catch (error) {
            console.error('Error fetching ZIP file contents:', error);
            alert('Failed to fetch ZIP file contents');
        }
    };

    const handleCloseFileContentsModal = () => {
        setShowFileContentsModal(false);
        setFileContents([]);
    };

    const handleShowUploadedFiles = () => {
        setShowUploadedFilesModal(true);
    };

    const handleCloseUploadedFilesModal = () => {
        setShowUploadedFilesModal(false);
    };

    const handleRateIdea = async (ideaId, rating) => {
        if (user.type !== 'Lecturer') return;

        try {
            const updatedIdea = await rateIdea(ideaId, user._id, rating);
            setIdeas(prevIdeas => prevIdeas.map(idea => idea._id === ideaId ? updatedIdea : idea));
            setSelectedRating(prevSelectedRating => ({
                ...prevSelectedRating,
                [ideaId]: rating // Update the selected rating for the specific idea
            }));
        } catch (error) {
            console.error('Error rating idea:', error);
        }
    };


    let user = JSON.parse(localStorage.getItem('user'));
    return (
        <div className="ideas-container">
            <div className="page-title-container">
                <div className="title-subtitle-container">
                    <div className="page-title">Posts</div>
                    <p className="page-subtitle">Share between Students and Lecturers and contribute to the Students'
                        Community!</p>
                </div>
                <Button onClick={() => setShowModal(true)} className="create-idea-button">
                    Create New Post
                </Button>
            </div>

            <Modal show={showModal} onHide={handleCloseModal} centered className="custom-modal">
                <Modal.Header closeButton>
                    <Modal.Title>New Post</Modal.Title>
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
                            {remainingTitleChars} characters remaining
                        </small>
                        <textarea
                            placeholder="Description"
                            value={description}
                            onChange={handleDescriptionChange}
                            className="form-control mb-2"
                            rows="5"
                        />
                        <small className="char-reminder">
                            {remainingDescriptionChars} characters remaining
                        </small>
                    </div>
                    <Button className="upload-button" onClick={() => setShowFileUploadModal(true)}>Upload Files</Button>
                    <br/>
                    <p1 style={{color: 'lightblue'}}>Number of uploaded files: {files.length}/{MAX_FILE_COUNT}</p1>
                    <br/>
                    <p2 style={{color: 'red'}}>More than 9 files? Upload ZIP</p2>
                    <ul className="uploaded-files-list">
                        {files.map((file, index) => (
                            <li key={index}>
                                {file.name} <Button variant="link"
                                                    onClick={() => handleFileRemove(index)}>Remove</Button>
                            </li>
                        ))}
                    </ul>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal}>
                        Cancel
                    </Button>
                    <Button variant="success" onClick={handleAddIdea} disabled={loadingSubmit}>
                        {loadingSubmit ? <Spinner animation="border" size="sm"/> : 'Submit'}
                    </Button>
                </Modal.Footer>
            </Modal>

            <FileUploadModal
                show={showFileUploadModal}
                handleClose={() => setShowFileUploadModal(false)}
                handleFilesSubmit={handleFileUpload}
            />

            <Modal show={showUploadedFilesModal} onHide={handleCloseUploadedFilesModal} centered
                   className="custom-modal">
                <Modal.Header closeButton>
                    <Modal.Title>Uploaded Files</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <ul>
                        {files.map((file, index) => (
                            <li key={index}>{file.name}</li>
                        ))}
                    </ul>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseUploadedFilesModal}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

            <div className="ideas-list">
                {loadingIdeas ? (
                    <p className="loading">Loading ideas...</p>
                ) : errorIdeas ? (
                    <p className="error">{errorIdeas}</p>
                ) : ideas.length > 0 ? (
                    ideas.map((idea) => (
                        <div key={idea._id} className="idea-bubble">
                            <div className="creator">
                                {topContributors.includes(idea.user._id) && (
                                    <span role="img" aria-label="trophy">🏆</span>
                                )}
                                {`${idea.user.fullName} (${idea.user.type})`}
                                <span className="post-time">
                                {` - ${formatDistanceToNow(new Date(idea.createdAt))} ago`}
                                </span>
                            </div>
                            <div className="description">{idea.description}</div>
                            <div className="files-and-action">
                                <div className="files">
                                    {idea.files.map(file => (
                                        <div key={file._id} className="file-item">
                                            <button onClick={() => handleDownload(file._id)} className="file-button">
                                                <img src={getFileIcon(file.fileName)} alt="File Icon"
                                                     className="file-icon"/>
                                                <div className="file-name">
                                                    {file.fileName}
                                                </div>
                                            </button>
                                            <div className="file-count">
                                                {`(${file.fileCount} files)`}
                                            </div>
                                            <Button variant="link" onClick={() => handleViewContents(file._id)}>
                                                View Contents
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                                {/* Conditional rendering for like or rating based on user type */}
                                <div className="actions">
                                    {user.type === 'Student' ? (
                                        <Button
                                            onClick={() => handleLike(idea._id)}
                                            variant="outline-success"
                                            disabled={loadingLikes[idea._id]}
                                        >
                                            {idea.likes.some(like => like._id === user._id) ? 'Unlike' : 'Like'}
                                        </Button>
                                    ) : (
                                        <div className="rating">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <span
                                                    key={star}
                                                    onClick={() => handleRateIdea(idea._id, star)}
                                                    style={{
                                                        cursor: 'pointer',
                                                        color: star <= (idea.ratings.find(r => r.userId === user._id)?.rating || 0) ? 'gold' : 'gray'
                                                    }}
                                                >
                                                ★
                                            </span>
                                            ))}
                                            {/* Display selected rating next to stars */}
                                            <span style={{ marginLeft: '8px', color: 'black' }}>
                                            ({selectedRating[idea._id] || idea.ratings.find(r => r.userId === user._id)?.rating || 0})
                                        </span>
                                        </div>
                                    )}
                                    <span className="engagement-info">
        {`Likes: ${idea.likes.length}, Average Rating: ${
            idea.ratingCount > 0
                ? (idea.totalRatings / idea.ratingCount).toFixed(1)
                : 'No ratings'
        }`}
    </span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <h1 className="no-ideas">No ideas to display.</h1>
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
                                {showLikes
                                    .sort((a, b) => {
                                        if (a.type === 'Lecturer' && b.type !== 'Lecturer') return -1;
                                        if (a.type !== 'Lecturer' && b.type === 'Lecturer') return 1;
                                        return 0;
                                    })
                                    .map(like => (
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


            <FileContentsModal
                show={showFileContentsModal}
                handleClose={handleCloseFileContentsModal}
                fileContents={fileContents}
            />
        </div>
    );
}

export default Ideas;
