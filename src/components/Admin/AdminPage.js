import React, { useState, useEffect } from 'react';
import { fetchUsers, changeUserType } from '../../services/api.service';
import { toast } from 'react-toastify';
import './AdminPage.css';

const AdminPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const usersData = await fetchUsers();
                setUsers(usersData);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching users:', error);
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    const handleTypeChange = async (userId, type) => {
        try {
            await changeUserType(userId, type);
            setUsers(users.map(user => user._id === userId ? { ...user, type } : user));
            toast.success('User type updated successfully');
        } catch (error) {
            console.error('Error updating type:', error);
            toast.error('Failed to update user type');
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="admin-page-container">
            <h1>Admin Page</h1>
            <table className="admin-table">
                <thead>
                <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Type</th>
                    <th>Action</th>
                </tr>
                </thead>
                <tbody>
                {users.map(user => (
                    <tr key={user._id}>
                        <td>{user.fullName}</td>
                        <td>{user.email}</td>
                        <td>{user.type}</td>
                        <td>
                            <select
                                value={user.type}
                                onChange={(e) => handleTypeChange(user._id, e.target.value)}
                            >
                                <option value="Student">Student</option>
                                <option value="Lecturer">Lecturer</option>
                                <option value="Admin">Admin</option>
                            </select>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default AdminPage;
