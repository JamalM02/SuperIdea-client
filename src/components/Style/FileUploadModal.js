import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Modal, Button, Spinner } from 'react-bootstrap';
import './FileUploadModal.css';

const MAX_FILE_COUNT = 9;

const FileUploadModal = ({ show, handleClose, handleFilesSubmit }) => {
    const [files, setFiles] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!show) {
            setFiles([]);
            setError('');
        }
    }, [show]);

    const onDrop = useCallback((acceptedFiles) => {
        const newFiles = [...files, ...acceptedFiles];
        if (newFiles.length > MAX_FILE_COUNT) {
            setError(`You can only upload up to ${MAX_FILE_COUNT} files.`);
        } else {
            setFiles(newFiles);
            setError('');
        }
    }, [files]);

    const handleRemoveFile = (file) => {
        const updatedFiles = files.filter(f => f !== file);
        setFiles(updatedFiles);
        if (updatedFiles.length === 0) {
            setError('');
        }
    };

    const handleSubmit = () => {
        setLoading(true);
        handleFilesSubmit(files);
        setLoading(false);
        handleClose();
    };

    const { getRootProps, getInputProps } = useDropzone({ onDrop });

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Upload Files</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div {...getRootProps({ className: 'dropzone' })}>
                    <input {...getInputProps()} />
                    <p>Drag & drop files here, or click to select files</p>
                </div>
                {error && <p className="error">{error}</p>}
                <div className="file-list">
                    {files.map(file => (
                        <div key={file.path} className="file-item">
                            <span>{file.path}</span>
                            <button onClick={() => handleRemoveFile(file)}>X</button>
                        </div>
                    ))}
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Cancel
                </Button>
                <Button variant="primary" onClick={handleSubmit} disabled={files.length === 0 || files.length > MAX_FILE_COUNT || loading}>
                    {loading ? <Spinner animation="border" size="sm" /> : 'Add Files'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default FileUploadModal;
