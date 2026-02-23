import React, { useState, useEffect } from 'react';
import axios from 'axios';
import loadingGif from '../loading.gif';

const API_BASE_URL = 'http://localhost:5000';

const Materials = () => {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState(null);
    const [editForm, setEditForm] = useState({
        title: '',
        description: '',
        type: '',
        semester: '',
        subject: ''
    });
    const [uploadForm, setUploadForm] = useState({
        title: '',
        description: '',
        type: '',
        semester: '',
        subject: '',
        file: null
    });
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);

    // Fetch materials from backend
    const fetchMaterials = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get(`${API_BASE_URL}/materials`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setMaterials(response.data);
        } catch (error) {
            console.error('Error fetching materials:', error);
            showMessage('Failed to fetch materials. Please try again.', 'error');
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
    const handleEdit = (material) => {
        setEditingMaterial(material);
        setEditForm({
            title: material.title,
            description: material.description || '',
            type: material.type,
            semester: material.semester,
            subject: material.subject
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
                `${API_BASE_URL}/materials/${editingMaterial._id}`,
                editForm,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Update material in state
            setMaterials(prev => prev.map(material =>
                material._id === editingMaterial._id ? response.data.material : material
            ));

            setEditingMaterial(null);
            showMessage('Material updated successfully!', 'success');
        } catch (error) {
            console.error('Error updating material:', error);
            showMessage('Failed to update material. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Handle delete button click
    const handleDelete = async (materialId) => {
        if (!window.confirm('Are you sure you want to delete this material?')) {
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            await axios.delete(`${API_BASE_URL}/materials/${materialId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Remove material from state
            setMaterials(prev => prev.filter(material => material._id !== materialId));
            showMessage('Material deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting material:', error);
            showMessage('Failed to delete material. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Handle upload form input change
    const handleUploadInputChange = (e) => {
        const { name, value, files } = e.target;
        if (files && files.length > 0) {
            setUploadForm(prev => ({
                ...prev,
                file: files[0]
            }));
        } else {
            setUploadForm(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    // Handle upload form submission
    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const formData = new FormData();

            // Append form fields
            Object.entries(uploadForm).forEach(([key, value]) => {
                if (key !== 'file' && value) {
                    formData.append(key, value);
                }
            });

            // Append file
            if (uploadForm.file) {
                formData.append('file', uploadForm.file);
            }

            const response = await axios.post(
                `${API_BASE_URL}/upload-material`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            // Add new material to state
            const newMaterial = {
                _id: Date.now().toString(),
                ...uploadForm,
                fileName: uploadForm.file.name,
                fileUrl: response.data.fileUrl,
                uploadedAt: new Date().toISOString()
            };
            setMaterials(prev => [newMaterial, ...prev]);

            setShowUploadModal(false);
            setUploadForm({
                title: '',
                description: '',
                type: '',
                semester: '',
                subject: '',
                file: null
            });
            showMessage('Material uploaded successfully!', 'success');
        } catch (error) {
            console.error('Error uploading material:', error);
            showMessage('Failed to upload material. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Handle file view
    const handleViewFile = (fileUrl) => {
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
        fetchMaterials();
    }, []);

    return (
        <div className="materials-container">
            {/* Message */}
            {message && (
                <div className={`message ${messageType}`}>
                    {message}
                </div>
            )}

            {/* Header */}
            <div className="materials-header">
                <h2>Materials Management</h2>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowUploadModal(true)}
                >
                    <i className="fa-solid fa-plus"></i> Upload Material
                </button>
            </div>

            {/* Loading Indicator */}
            {loading && (
                <div className="loading-container">
                    <img src={loadingGif} alt="Loading..." className="loading-gif" />
                    <p>Loading...</p>
                </div>
            )}

            {/* Materials Grid */}
            {!loading && materials.length === 0 && (
                <div className="empty-state">
                    <i className="fa-solid fa-inbox"></i>
                    <h3>No Materials Found</h3>
                    <p>There are no materials to display.</p>
                </div>
            )}

            {!loading && materials.length > 0 && (
                <div className="materials-grid">
                    {materials.map(material => (
                        <div key={material._id} className="material-card">
                            <div className="material-header">
                                <div className="material-icon">
                                    <i className="fa-solid fa-file-pdf"></i>
                                </div>
                                <div className="material-info">
                                    <h4 className="material-title">{material.title}</h4>
                                    <p className="material-meta">
                                        {formatDate(material.uploadedAt)}
                                    </p>
                                </div>
                            </div>

                            {material.description && (
                                <p className="material-description">{material.description}</p>
                            )}

                            <div className="material-details">
                                <div className="material-detail-item">
                                    <span className="detail-label">Type:</span>
                                    <span className="detail-value">{material.type}</span>
                                </div>
                                <div className="material-detail-item">
                                    <span className="detail-label">Semester:</span>
                                    <span className="detail-value">{material.semester}</span>
                                </div>
                                <div className="material-detail-item">
                                    <span className="detail-label">Subject:</span>
                                    <span className="detail-value">{material.subject}</span>
                                </div>
                                {material.fileName && (
                                    <div className="material-detail-item">
                                        <span className="detail-label">File:</span>
                                        <span className="detail-value">{material.fileName}</span>
                                    </div>
                                )}
                            </div>

                            <div className="material-actions">
                                <button
                                    className="action-btn view-btn"
                                    onClick={() => handleViewFile(material.fileUrl)}
                                >
                                    <i className="fa-solid fa-eye"></i> View
                                </button>
                                <button
                                    className="action-btn edit-btn"
                                    onClick={() => handleEdit(material)}
                                >
                                    <i className="fa-solid fa-edit"></i> Edit
                                </button>
                                <button
                                    className="action-btn delete-btn"
                                    onClick={() => handleDelete(material._id)}
                                >
                                    <i className="fa-solid fa-trash"></i> Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Material Modal */}
            {showUploadModal && (
                <div className="modal">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Upload Material</h3>
                            <button
                                className="modal-close"
                                onClick={() => setShowUploadModal(false)}
                            >
                                <i className="fa-solid fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleUploadSubmit} className="upload-form">
                            <div className="form-group">
                                <label htmlFor="upload-title">Title</label>
                                <input
                                    type="text"
                                    id="upload-title"
                                    name="title"
                                    value={uploadForm.title}
                                    onChange={handleUploadInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="upload-description">Description</label>
                                <textarea
                                    id="upload-description"
                                    name="description"
                                    value={uploadForm.description}
                                    onChange={handleUploadInputChange}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="upload-type">Type</label>
                                <select
                                    id="upload-type"
                                    name="type"
                                    value={uploadForm.type}
                                    onChange={handleUploadInputChange}
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
                                <label htmlFor="upload-semester">Semester</label>
                                <input
                                    type="text"
                                    id="upload-semester"
                                    name="semester"
                                    value={uploadForm.semester}
                                    onChange={handleUploadInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="upload-subject">Subject</label>
                                <input
                                    type="text"
                                    id="upload-subject"
                                    name="subject"
                                    value={uploadForm.subject}
                                    onChange={handleUploadInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="upload-file">File</label>
                                <input
                                    type="file"
                                    id="upload-file"
                                    name="file"
                                    accept=".pdf"
                                    onChange={handleUploadInputChange}
                                    required
                                />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn cancel-btn" onClick={() => setShowUploadModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn save-btn">
                                    Upload Material
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Material Modal */}
            {editingMaterial && (
                <div className="modal">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Edit Material</h3>
                            <button
                                className="modal-close"
                                onClick={() => setEditingMaterial(null)}
                            >
                                <i className="fa-solid fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="edit-form">
                            <div className="form-group">
                                <label htmlFor="edit-title">Title</label>
                                <input
                                    type="text"
                                    id="edit-title"
                                    name="title"
                                    value={editForm.title}
                                    onChange={handleEditInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="edit-description">Description</label>
                                <textarea
                                    id="edit-description"
                                    name="description"
                                    value={editForm.description}
                                    onChange={handleEditInputChange}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="edit-type">Type</label>
                                <select
                                    id="edit-type"
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
                                <label htmlFor="edit-semester">Semester</label>
                                <input
                                    type="text"
                                    id="edit-semester"
                                    name="semester"
                                    value={editForm.semester}
                                    onChange={handleEditInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="edit-subject">Subject</label>
                                <input
                                    type="text"
                                    id="edit-subject"
                                    name="subject"
                                    value={editForm.subject}
                                    onChange={handleEditInputChange}
                                    required
                                />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn cancel-btn" onClick={() => setEditingMaterial(null)}>
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
                .materials-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                }

                .materials-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .materials-header h2 {
                    margin: 0;
                    color: #333;
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

                .materials-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 20px;
                    margin-top: 20px;
                }

                .material-card {
                    background: white;
                    border-radius: 8px;
                    padding: 20px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    transition: transform 0.2s, box-shadow 0.2s;
                }

                .material-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                }

                .material-header {
                    display: flex;
                    align-items: flex-start;
                    gap: 15px;
                    margin-bottom: 15px;
                }

                .material-icon {
                    font-size: 40px;
                    color: #e74c3c;
                    flex-shrink: 0;
                }

                .material-info {
                    flex: 1;
                }

                .material-title {
                    margin: 0 0 8px 0;
                    font-size: 16px;
                    font-weight: 600;
                    color: #333;
                }

                .material-meta {
                    margin: 0;
                    font-size: 12px;
                    color: #666;
                }

                .material-description {
                    margin: 15px 0;
                    font-size: 14px;
                    color: #555;
                    line-height: 1.5;
                }

                .material-details {
                    margin: 15px 0;
                }

                .material-detail-item {
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

                .material-actions {
                    display: flex;
                    gap: 10px;
                    margin-top: 20px;
                }

                .action-btn {
                    flex: 1;
                    padding: 8px 12px;
                    border: none;
                    border-radius: 4px;
                    font-size: 14px;
                    cursor: pointer;
                    transition: background-color 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 5px;
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
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px;
                    border-bottom: 1px solid #e0e0e0;
                }

                .modal-header h3 {
                    margin: 0;
                    color: #333;
                }

                .modal-close {
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #666;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 4px;
                    transition: background-color 0.2s;
                }

                .modal-close:hover {
                    background-color: #f5f5f5;
                }

                .upload-form,
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
                    min-height: 80px;
                    resize: vertical;
                }

                .form-actions {
                    display: flex;
                    gap: 10px;
                    margin-top: 20px;
                }

                .btn {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 4px;
                    font-size: 14px;
                    cursor: pointer;
                    transition: background-color 0.2s;
                }

                .btn-primary {
                    background-color: #3498db;
                    color: white;
                }

                .btn-primary:hover {
                    background-color: #2980b9;
                }

                .cancel-btn {
                    background-color: #95a5a6;
                    color: white;
                }

                .cancel-btn:hover {
                    background-color: #7f8c8d;
                }

                .save-btn {
                    background-color: #27ae60;
                    color: white;
                }

                .save-btn:hover {
                    background-color: #219a52;
                }
            `}</style>
        </div>
    );
};

export default Materials;
