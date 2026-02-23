import React, { useState, useEffect } from 'react';
import axios from 'axios';
import loadingGif from '../loading.gif';

const API_BASE_URL = 'http://localhost:5000';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({
        email: '',
        password: '',
        role: 'user'
    });
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const [changePasswordForm, setChangePasswordForm] = useState({
        userId: '',
        newPassword: ''
    });
    const [showUpdateRoleModal, setShowUpdateRoleModal] = useState(false);
    const [updateRoleForm, setUpdateRoleForm] = useState({
        userId: '',
        role: ''
    });

    // Fetch users from backend
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get(`${API_BASE_URL}/api/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setUsers(response.data.users);
        } catch (error) {
            console.error('Error fetching users:', error);
            showMessage('Failed to fetch users. Please try again.', 'error');
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

    // Handle create form input change
    const handleCreateInputChange = (e) => {
        const { name, value } = e.target;
        setCreateForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle create user submission
    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.post(
                `${API_BASE_URL}/api/users`,
                createForm,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            setUsers(prev => [response.data.user, ...prev]);
            setShowCreateModal(false);
            setCreateForm({
                email: '',
                password: '',
                role: 'user'
            });
            showMessage('User created successfully!', 'success');
        } catch (error) {
            console.error('Error creating user:', error);
            const errorMessage = error.response?.data?.message || 'Failed to create user. Please try again.';
            showMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Handle change password modal open
    const handleChangePasswordOpen = (user) => {
        setChangePasswordForm(prev => ({
            ...prev,
            userId: user._id
        }));
        setShowChangePasswordModal(true);
    };

    // Handle change password form input change
    const handleChangePasswordInputChange = (e) => {
        const { name, value } = e.target;
        setChangePasswordForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle change password submission
    const handleChangePasswordSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            await axios.put(
                `${API_BASE_URL}/api/users/${changePasswordForm.userId}/password`,
                { newPassword: changePasswordForm.newPassword },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            setShowChangePasswordModal(false);
            setChangePasswordForm({
                userId: '',
                newPassword: ''
            });
            showMessage('Password changed successfully!', 'success');
        } catch (error) {
            console.error('Error changing password:', error);
            const errorMessage = error.response?.data?.message || 'Failed to change password. Please try again.';
            showMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Handle update role modal open
    const handleUpdateRoleOpen = (user) => {
        setUpdateRoleForm(prev => ({
            ...prev,
            userId: user._id,
            role: user.role
        }));
        setShowUpdateRoleModal(true);
    };

    // Handle update role form input change
    const handleUpdateRoleInputChange = (e) => {
        const { name, value } = e.target;
        setUpdateRoleForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle update role submission
    const handleUpdateRoleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.put(
                `${API_BASE_URL}/api/users/${updateRoleForm.userId}/role`,
                { role: updateRoleForm.role },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            setUsers(prev => prev.map(user =>
                user._id === updateRoleForm.userId ? response.data.user : user
            ));
            setShowUpdateRoleModal(false);
            setUpdateRoleForm({
                userId: '',
                role: ''
            });
            showMessage('User role updated successfully!', 'success');
        } catch (error) {
            console.error('Error updating user role:', error);
            const errorMessage = error.response?.data?.message || 'Failed to update user role. Please try again.';
            showMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Handle delete user
    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) {
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            await axios.delete(`${API_BASE_URL}/api/users/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            setUsers(prev => prev.filter(user => user._id !== userId));
            showMessage('User deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting user:', error);
            const errorMessage = error.response?.data?.message || 'Failed to delete user. Please try again.';
            showMessage(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
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

    // Get role badge color
    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'superadmin':
                return 'badge-danger';
            case 'admin':
                return 'badge-warning';
            case 'user':
                return 'badge-success';
            default:
                return 'badge-primary';
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    return (
        <div className="users-container">
            {/* Message */}
            {message && (
                <div className={`message ${messageType}`}>
                    {message}
                </div>
            )}

            {/* Header */}
            <div className="users-header">
                <h2>Users Management</h2>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowCreateModal(true)}
                >
                    <i className="fa-solid fa-plus"></i> Add User
                </button>
            </div>

            {/* Loading Indicator */}
            {loading && (
                <div className="loading-container">
                    <img src={loadingGif} alt="Loading..." className="loading-gif" />
                    <p>Loading...</p>
                </div>
            )}

            {/* Users Table */}
            {!loading && users.length === 0 && (
                <div className="empty-state">
                    <i className="fa-solid fa-users"></i>
                    <h3>No Users Found</h3>
                    <p>There are no users to display.</p>
                </div>
            )}

            {!loading && users.length > 0 && (
                <div className="users-table-container">
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Created At</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user._id}>
                                    <td>{user.email}</td>
                                    <td>
                                        <span className={`badge ${getRoleBadgeColor(user.role)}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td>{formatDate(user.createdAt)}</td>
                                    <td>
                                        {user.role === 'user' ? (
                                            <div className="action-buttons">
                                                <button
                                                    className="btn btn-sm btn-info"
                                                    onClick={() => handleChangePasswordOpen(user)}
                                                    title="Change Password"
                                                >
                                                    <i className="fa-solid fa-key"></i>
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => handleDeleteUser(user._id)}
                                                    title="Delete User"
                                                >
                                                    <i className="fa-solid fa-trash"></i>
                                                </button>
                                            </div>
                                        ) : (
                                            <span style={{ color: '#999' }}><i className="fa-solid fa-lock"></i> Protected</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="modal">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Add New User</h3>
                            <button
                                className="modal-close"
                                onClick={() => setShowCreateModal(false)}
                            >
                                <i className="fa-solid fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleCreateSubmit} className="create-form">
                            <div className="form-group">
                                <label htmlFor="create-email">Email</label>
                                <input
                                    type="email"
                                    id="create-email"
                                    name="email"
                                    value={createForm.email}
                                    onChange={handleCreateInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="create-password">Password</label>
                                <input
                                    type="password"
                                    id="create-password"
                                    name="password"
                                    value={createForm.password}
                                    onChange={handleCreateInputChange}
                                    required
                                    minLength={8}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="create-role">Role</label>
                                <select
                                    id="create-role"
                                    name="role"
                                    value={createForm.role}
                                    onChange={handleCreateInputChange}
                                    required
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                    <option value="superadmin">Super Admin</option>
                                </select>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn cancel-btn" onClick={() => setShowCreateModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn save-btn">
                                    Create User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Change Password Modal */}
            {showChangePasswordModal && (
                <div className="modal">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Change Password</h3>
                            <button
                                className="modal-close"
                                onClick={() => setShowChangePasswordModal(false)}
                            >
                                <i className="fa-solid fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleChangePasswordSubmit} className="change-password-form">
                            <div className="form-group">
                                <label htmlFor="current-password">Current Password</label>
                                <input
                                    type="password"
                                    id="current-password"
                                    name="currentPassword"
                                    value={changePasswordForm.currentPassword}
                                    onChange={handleChangePasswordInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="new-password">New Password</label>
                                <input
                                    type="password"
                                    id="new-password"
                                    name="newPassword"
                                    value={changePasswordForm.newPassword}
                                    onChange={handleChangePasswordInputChange}
                                    required
                                    minLength={8}
                                />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn cancel-btn" onClick={() => setShowChangePasswordModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn save-btn">
                                    Change Password
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Update Role Modal */}
            {showUpdateRoleModal && (
                <div className="modal">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Update User Role</h3>
                            <button
                                className="modal-close"
                                onClick={() => setShowUpdateRoleModal(false)}
                            >
                                <i className="fa-solid fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleUpdateRoleSubmit} className="update-role-form">
                            <div className="form-group">
                                <label htmlFor="update-role">Role</label>
                                <select
                                    id="update-role"
                                    name="role"
                                    value={updateRoleForm.role}
                                    onChange={handleUpdateRoleInputChange}
                                    required
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                    <option value="superadmin">Super Admin</option>
                                </select>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn cancel-btn" onClick={() => setShowUpdateRoleModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn save-btn">
                                    Update Role
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
