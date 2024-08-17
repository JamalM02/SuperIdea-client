import React, { useState, useEffect } from 'react';
import { fetchUsers } from '../../services/api.service';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import './AdminPage.css';

const AdminPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newType, setNewType] = useState('');
    const navigate = useNavigate();

    const adminName = "Admin"; // Replace this with the actual admin's name

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

    const handleTypeChangeRequest = (user, type) => {
        setSelectedUser(user);
        setNewType(type);
        navigate('/verify', {
            state: {
                email: user.email,
                fullName: user.fullName,
                context: 'typeChange',
                userId: user._id,
                newType: type,
                adminName: adminName
            },
        });
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
                        <td data-label="Username">{user.fullName}</td>
                        <td data-label="Email">{user.email}</td>
                        <td data-label="Type">{user.type}</td>
                        <td data-label="Action">
                            <select
                                value={user.type}
                                onChange={(e) => handleTypeChangeRequest(user, e.target.value)}
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
