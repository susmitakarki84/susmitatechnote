import React, { useState, useEffect } from 'react';
import axios from 'axios';
import loadingGif from '../loading.gif';

const API_BASE_URL = 'http://localhost:5000';

const UploadedFile = () => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingFile, setEditingFile] = useState(null);
    const [editForm, setEditForm] = useState({
        title: '',
        description: '',
        type: '',
        semester: '',
        subject: ''
    });
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');

    // Fetch files from backend
    const fetchFiles = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get(`${API_BASE_URL}/api/user-uploads`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setFiles(response.data);
        } catch (error) {
            console.error('Error fetching files:', error);
            showMessage('Failed to fetch files. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Show message to user
    const showMessage = (text, type) => {
        setMessage(text);
        setMessageType(type);
        setTimeout(() => {
            setMessage('');
            setMessageType('');
        }, 3000);
    };

    // Handle edit button click
    const handleEdit = (file) => {
        setEditingFile(file);
        setEditForm({
            title: file.title,
            description: file.description || '',
            type: file.type,
            semester: file.semester,
            subject: file.subject
        });
    };

    // Handle edit form input change
    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle edit form submission
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.put(
                `${API_BASE_URL}/api/user-uploads/${editingFile._id}`,
                editForm,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Update file in state
            setFiles(prev => prev.map(file =>
                file._id === editingFile._id ? response.data.upload : file
            ));

            setEditingFile(null);
            showMessage('File updated successfully!', 'success');
        } catch (error) {
            console.error('Error updating file:', error);
            showMessage('Failed to update file. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Handle delete button click
    const handleDelete = async (fileId) => {
        if (!window.confirm('Are you sure you want to delete this file?')) {
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            await axios.delete(`${API_BASE_URL}/api/user-uploads/${fileId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Remove file from state
            setFiles(prev => prev.filter(file => file._id !== fileId));
            showMessage('File deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting file:', error);
            showMessage('Failed to delete file. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Handle PDF view
    const handleViewPDF = (fileUrl) => {
        window.open(fileUrl, '_blank');
    };

    // Get file size in readable format
    const formatFileSize = (size) => {
        if (!size) return 'Unknown size';

        if (size < 1024) return `${size} B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    useEffect(() => {
        fetchFiles();
    }, []);

    return (
        <div className="uploaded-file-container">
            {/* Message */}
            {message && (
                <div className={`message ${messageType}`}>
                    {message}
                </div>
            )}

            {/* Loading Indicator */}
            {loading && (
                <div className="loading-container">
                    <img src={loadingGif} alt="Loading..." className="loading-gif" />
                    <p>Loading...</p>
                </div>
            )}

            {/* Files Grid */}
            {!loading && files.length === 0 && (
                <div className="empty-state">
                    <i className="fa-solid fa-inbox"></i>
                    <h3>No Files Found</h3>
                    <p>There are no files to display.</p>
                </div>
            )}

            {!loading && files.length > 0 && (
                <div className="files-grid">
                    {files.map(file => (
                        <div key={file._id} className="file-card">
                            <div className="file-header">
                                <div className="file-icon">
                                    <i className="fa-solid fa-file-pdf"></i>
                                </div>
                                <div className="file-info">
                                    <h4 className="file-title">{file.title}</h4>
                                    <p className="file-meta">
                                        {formatDate(file.uploadedAt)} • {formatFileSize(file.size)}
                                    </p>
                                </div>
                            </div>

                            {file.description && (
                                <p className="file-description">{file.description}</p>
                            )}

                            <div className="file-details">
                                <div className="file-detail-item">
                                    <span className="detail-label">Type:</span>
                                    <span className="detail-value">{file.type}</span>
                                </div>
                                <div className="file-detail-item">
                                    <span className="detail-label">Semester:</span>
                                    <span className="detail-value">{file.semester}</span>
                                </div>
                                <div className="file-detail-item">
                                    <span className="detail-label">Subject:</span>
                                    <span className="detail-value">{file.subject}</span>
                                </div>
                                <div className="file-detail-item">
                                    <span className="detail-label">Uploader:</span>
                                    <span className="detail-value">{file.uploaderEmail}</span>
                                </div>
                                <div className="file-detail-item">
                                    <span className="detail-label">Status:</span>
                                    <span className={`status-badge ${file.status}`}>
                                        {file.status}
                                    </span>
                                </div>
                            </div>

                            <div className="file-actions">
                                <button
                                    className="action-btn view-btn"
                                    onClick={() => handleViewPDF(file.fileUrl)}
                                >
                                    <i className="fa-solid fa-eye"></i> View PDF
                                </button>
                                <button
                                    className="action-btn edit-btn"
                                    onClick={() => handleEdit(file)}
                                >
                                    <i className="fa-solid fa-edit"></i> Edit
                                </button>
                                <button
                                    className="action-btn delete-btn"
                                    onClick={() => handleDelete(file._id)}
                                >
                                    <i className="fa-solid fa-trash"></i> Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Edit File Modal */}
            {editingFile && (
                <div className="modal">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Edit File</h3>
                            <button
                                className="modal-close"
                                onClick={() => setEditingFile(null)}
                            >
                                <i className="fa-solid fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="edit-form">
                            <div className="form-group">
                                <label htmlFor="title">Title</label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={editForm.title}
                                    onChange={handleEditInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="description">Description</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={editForm.description}
                                    onChange={handleEditInputChange}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="type">Type</label>
                                <select
                                    id="type"
                                    name="type"
                                    value={editForm.type}
                                    onChange={handleEditInputChange}
                                    required
                                >
                                    <option value="">Select type</option>
                                    <option value="Notes">Notes</option>
                                    <option value="Syllabus">Syllabus</option>
                                    <option value="Previous Question">Previous Question</option>
                                    <option value="Slides">Slides</option>
                                    <option value="Lab Manual">Lab Manual</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="semester">Semester</label>
                                <input
                                    type="text"
                                    id="semester"
                                    name="semester"
                                    value={editForm.semester}
                                    onChange={handleEditInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="subject">Subject</label>
                                <input
                                    type="text"
                                    id="subject"
                                    name="subject"
                                    value={editForm.subject}
                                    onChange={handleEditInputChange}
                                    required
                                />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn cancel-btn" onClick={() => setEditingFile(null)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn save-btn">
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
        .uploaded-file-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .message {
          padding: 12px 20px;
          border-radius: 4px;
          margin-bottom: 20px;
          font-weight: 500;
        }

        .message.success {
          background-color: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .message.error {
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .loading-container {
          text-align: center;
          padding: 80px 20px;
        }

        .loading-gif {
          width: 50px;
          height: 50px;
          margin-bottom: 20px;
        }

        .empty-state {
          text-align: center;
          padding: 80px 20px;
          color: #666;
        }

        .empty-state i {
          font-size: 60px;
          margin-bottom: 20px;
          color: #ccc;
        }

        .files-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }

        .file-card {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .file-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .file-header {
          display: flex;
          align-items: flex-start;
          gap: 15px;
          margin-bottom: 15px;
        }

        .file-icon {
          font-size: 40px;
          color: #e74c3c;
          flex-shrink: 0;
        }

        .file-info {
          flex: 1;
        }

        .file-title {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }

        .file-meta {
          margin: 0;
          font-size: 12px;
          color: #666;
        }

        .file-description {
          margin: 15px 0;
          font-size: 14px;
          color: #555;
          line-height: 1.5;
        }

        .file-details {
          margin: 15px 0;
        }

        .file-detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-size: 12px;
        }

        .detail-label {
          color: #666;
        }

        .detail-value {
          font-weight: 500;
          color: #333;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
          text-transform: capitalize;
        }

        .status-badge.pending {
          background-color: #fff3cd;
          color: #856404;
        }

        .status-badge.approved {
          background-color: #d4edda;
          color: #155724;
        }

        .status-badge.rejected {
          background-color: #f8d7da;
          color: #721c24;
        }

        .file-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }

        .action-btn {
          flex: 1;
          padding: 8px 12px;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          transition: background-color 0.2s;
        }

        .view-btn {
          background-color: #3498db;
          color: white;
        }

        .view-btn:hover {
          background-color: #2980b9;
        }

        .edit-btn {
          background-color: #f39c12;
          color: white;
        }

        .edit-btn:hover {
          background-color: #e67e22;
        }

        .delete-btn {
          background-color: #e74c3c;
          color: white;
        }

        .delete-btn:hover {
          background-color: #c0392b;
        }

        .modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background-color: white;
          border-radius: 8px;
          width: 90%;
          max-width: 500px;
          overflow: hidden;
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #eee;
          background-color: #f8f9fa;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 20px;
          color: #666;
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background-color 0.2s;
        }

        .modal-close:hover {
          background-color: #e9ecef;
        }

        .edit-form {
          padding: 20px;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
          color: #333;
          font-size: 14px;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          box-sizing: border-box;
        }

        .form-group textarea {
          resize: vertical;
          min-height: 80px;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }

        .btn {
          padding: 8px 20px;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .cancel-btn {
          background-color: #6c757d;
          color: white;
        }

        .cancel-btn:hover {
          background-color: #5a6268;
        }

        .save-btn {
          background-color: #28a745;
          color: white;
        }

        .save-btn:hover {
          background-color: #218838;
        }

        @media (max-width: 768px) {
          .files-grid {
            grid-template-columns: 1fr;
          }

          .file-actions {
            flex-direction: column;
          }
        }
      `}</style>
        </div>
    );
};

export default UploadedFile;