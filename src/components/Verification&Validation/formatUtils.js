// src/Register/formatUtils.js
export const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
};

export const validateFullName = (name) => {
    const nameParts = name.trim().split(' ');
    if (nameParts.length < 2) {
        return false;
    }
    for (let part of nameParts) {
        if (part.length === 0) {
            return false;
        }
    }
    return true;
};

export const formatFullName = (name) => {
    return name.trim().split(' ').map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(' ');
};
