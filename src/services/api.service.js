import axios from 'axios';

const API_URL = process.env.NODE_ENV === 'production'
    ? process.env.REACT_APP_API_URL_PROD
    : process.env.REACT_APP_API_URL_DEV;

export const fetchIdeas = async () => {
    const response = await axios.get(`${API_URL}/ideas`);
    return response.data;
};



export const createIdea = async (idea, files) => {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const simplifiedUser = {
            _id: user._id,
            fullName: user.fullName,
            type: user.type
        };

        const formData = new FormData();
        formData.append('title', idea.title);
        formData.append('description', idea.description);
        formData.append('user', JSON.stringify(simplifiedUser));

        files.forEach(file => {
            formData.append('files', file);
        });

        const response = await axios.post(`${API_URL}/ideas`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        if (error.response && error.response.data.errors) {
            throw new Error(error.response.data.errors.map(err => err.msg).join(', '));
        }
        throw new Error('Failed to create idea');
    }
};

export const getUserAchievements = async (userId) => {
    try {
        const response = await axios.get(`${API_URL}/users/achievements/${userId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching user achievements', error);
        throw error;
    }
};

export const getUserIdeas = async (userId) => {
    try {
        const response = await axios.get(`${API_URL}/users/${userId}/ideas`);
        return response.data;
    } catch (error) {
        console.error('Error fetching user ideas', error);
        throw error;
    }
};

export const getReport = async () => {
    try {
        const response = await axios.get(`${API_URL}/reports`);
        return response.data;
    } catch (error) {
        console.error('Error fetching report', error);
        throw error;
    }
};

export const likeIdea = async (ideaId, userId) => {
    try {
        const response = await axios.post(`${API_URL}/ideas/${ideaId}/like`, { userId });
        return response.data;
    } catch (error) {
        console.error('Error liking idea:', error);
        throw error;
    }
};

export const loginUser = async (credentials) => {
    try {
        const response = await axios.post(`${API_URL}/users/login`, credentials);
        return response.data;
    } catch (error) {
        if (error.response && error.response.data.errors) {
            throw new Error(error.response.data.errors.map(err => err.msg).join(', '));
        }
        throw new Error('Failed to login');
    }
};

export const registerUser = async (userData) => {
    try {
        const response = await axios.post(`${API_URL}/users/register`, userData);
        return response.data;
    } catch (error) {
        if (error.response && error.response.data.errors) {
            throw new Error(error.response.data.errors.map(err => err.msg).join(', '));
        }
        throw new Error('Failed to register user');
    }
};
