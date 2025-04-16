// src/utils/createDefaultTags.js
const Tag = require('../models/Tag');

/**
 * Create default tags for a new user
 * @param {string} userId - User ID
 */
const createDefaultTags = async (userId) => {
    try {
        const defaultTags = [
            {
                name: 'Important',
                color: '#e74c3c'
            },
            {
                name: 'Urgent',
                color: '#f39c12'
            },
            {
                name: 'Later',
                color: '#3498db'
            },
            {
                name: 'Quick Win',
                color: '#2ecc71'
            },
            {
                name: 'Waiting',
                color: '#9b59b6'
            }
        ];

        // Add user ID to each tag
        const tagsToInsert = defaultTags.map(tag => ({
            ...tag,
            user: userId
        }));

        // Insert all tags at once
        await Tag.insertMany(tagsToInsert);

        console.log(`Created default tags for user: ${userId}`);
    } catch (error) {
        console.error('Error creating default tags:', error);
    }
};

module.exports = createDefaultTags;