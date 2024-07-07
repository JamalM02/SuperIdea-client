import axios from 'axios';

const API_URL = process.env.NODE_ENV === 'production'
    ? process.env.REACT_APP_API_URL_PROD
    : process.env.REACT_APP_API_URL_DEV;

export const fetchIdeas = async () => {
    const response = await axios.get(`${API_URL}/ideas`);
    return response.data;
};

export const createIdea = async (idea) => {
    const response = await axios.post(`${API_URL}/ideas`, idea);
    return response.data;
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
        console.log('Fetched user ideas:', response.data); // Log the response data
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
        console.error('Error liking idea', error);
        throw error;
    }
};

export const loginUser = async (credentials) => {
    try {
        const response = await axios.post(`${API_URL}/users/login`, credentials);
        return response.data;
    } catch (error) {
        console.error('Error logging in', error);
        throw error;
    }
};

export const registerUser = async (userData) => {
    try {
        const response = await axios.post(`${API_URL}/users/register`, userData);
        return response.data;
    } catch (error) {
        console.error('Error registering user', error);
        throw error;
    }
};
