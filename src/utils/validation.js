// Basic validation functions for auth-related inputs

/**
 * Validates registration input
 * @param {Object} userData - User registration data
 * @returns {Object} - { isValid, errors }
 */
exports.validateRegisterInput = (userData) => {
    const errors = {};

    // Check name
    if (!userData.name) {
        errors.name = 'Name is required';
    } else if (userData.name.length < 2) {
        errors.name = 'Name must be at least 2 characters';
    }

    // Check email
    if (!userData.email) {
        errors.email = 'Email is required';
    } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userData.email)) {
            errors.email = 'Please provide a valid email address';
        }
    }

    // Check password
    if (!userData.password) {
        errors.password = 'Password is required';
    } else if (userData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Validates login input
 * @param {Object} userData - User login data
 * @returns {Object} - { isValid, errors }
 */
exports.validateLoginInput = (userData) => {
    const errors = {};

    // Check email
    if (!userData.email) {
        errors.email = 'Email is required';
    }

    // Check password
    if (!userData.password) {
        errors.password = 'Password is required';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Validates password change input
 * @param {Object} passwordData - Password change data
 * @returns {Object} - { isValid, errors }
 */
exports.validatePasswordChange = (passwordData) => {
    const errors = {};

    // Check current password
    if (!passwordData.currentPassword) {
        errors.currentPassword = 'Current password is required';
    }

    // Check new password
    if (!passwordData.newPassword) {
        errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
        errors.newPassword = 'New password must be at least 6 characters';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};