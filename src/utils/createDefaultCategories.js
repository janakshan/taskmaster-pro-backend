// src/utils/createDefaultCategories.js
const Category = require('../models/Category');

/**
 * Create default categories for a new user
 * @param {string} userId - User ID
 */
const createDefaultCategories = async (userId) => {
    try {
        const defaultCategories = [
            {
                name: 'Work',
                color: '#e74c3c',
                icon: 'briefcase',
                isDefault: true
            },
            {
                name: 'Personal',
                color: '#3498db',
                icon: 'user',
                isDefault: true
            },
            {
                name: 'Health',
                color: '#2ecc71',
                icon: 'heart',
                isDefault: true
            },
            {
                name: 'Finance',
                color: '#f39c12',
                icon: 'dollar-sign',
                isDefault: true
            },
            {
                name: 'Education',
                color: '#9b59b6',
                icon: 'book',
                isDefault: true
            }
        ];

        // Add user ID to each category
        const categoriesToInsert = defaultCategories.map(category => ({
            ...category,
            user: userId
        }));

        // Insert all categories at once
        await Category.insertMany(categoriesToInsert);

        console.log(`Created default categories for user: ${userId}`);
    } catch (error) {
        console.error('Error creating default categories:', error);
    }
};

module.exports = createDefaultCategories;