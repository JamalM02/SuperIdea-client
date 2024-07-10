import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const FileContentsModal = ({ show, handleClose, fileContents }) => {
    return (
        <Modal show={show} onHide={handleClose} centered className="custom-modal">
            <Modal.Header closeButton>
                <Modal.Title>ZIP File Contents</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {fileContents.length > 0 ? (
                    <ul className="file-contents-list">
                        {fileContents.map((file, index) => (
                            <li key={index}>
                                <strong>{index + 1}.</strong> {file}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No contents found in the ZIP file.</p>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default FileContentsModal;
