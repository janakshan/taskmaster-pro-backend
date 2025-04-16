// src/controllers/tagController.js
const Tag = require('../models/Tag');
const Task = require('../models/Task');
const mongoose = require('mongoose');

// Get all tags for a user
exports.getTags = async (req, res) => {
    try {
        const tags = await Tag.find({ user: req.user.id }).sort({ name: 1 });
        res.status(200).json({
            success: true,
            data: tags
        });
    } catch (error) {
        console.error('Error getting tags:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// Create a new tag
exports.createTag = async (req, res) => {
    try {
        const { name, color } = req.body;

        // Check if tag already exists for this user
        const existingTag = await Tag.findOne({
            name: name,
            user: req.user.id
        });

        if (existingTag) {
            return res.status(400).json({
                success: false,
                error: 'Tag already exists'
            });
        }

        const tag = await Tag.create({
            name,
            color: color || '#3498db',
            user: req.user.id
        });

        res.status(201).json({
            success: true,
            data: tag
        });
    } catch (error) {
        console.error('Error creating tag:', error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                error: 'Tag already exists'
            });
        }
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// Get a single tag
exports.getTag = async (req, res) => {
    try {
        const tag = await Tag.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!tag) {
            return res.status(404).json({
                success: false,
                error: 'Tag not found'
            });
        }

        res.status(200).json({
            success: true,
            data: tag
        });
    } catch (error) {
        console.error('Error getting tag:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// Update a tag
exports.updateTag = async (req, res) => {
    try {
        const { name, color } = req.body;

        let tag = await Tag.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!tag) {
            return res.status(404).json({
                success: false,
                error: 'Tag not found'
            });
        }

        // Only update fields that were actually passed
        if (name) tag.name = name;
        if (color) tag.color = color;

        await tag.save();

        res.status(200).json({
            success: true,
            data: tag
        });
    } catch (error) {
        console.error('Error updating tag:', error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                error: 'Tag with this name already exists'
            });
        }
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// Delete a tag
exports.deleteTag = async (req, res) => {
    try {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Find tag
            const tag = await Tag.findOne({
                _id: req.params.id,
                user: req.user.id
            }).session(session);

            if (!tag) {
                await session.abortTransaction();
                session.endSession();
                return res.status(404).json({
                    success: false,
                    error: 'Tag not found'
                });
            }

            // Update tasks that use this tag (pull tag from tags array)
            await Task.updateMany(
                { tags: req.params.id },
                { $pull: { tags: req.params.id } },
                { session }
            );

            // Delete the tag
            await Tag.findByIdAndDelete(req.params.id).session(session);

            await session.commitTransaction();
            session.endSession();

            res.status(200).json({
                success: true,
                data: {}
            });
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    } catch (error) {
        console.error('Error deleting tag:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// Get tasks by tag
exports.getTagTasks = async (req, res) => {
    try {
        const tag = await Tag.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!tag) {
            return res.status(404).json({
                success: false,
                error: 'Tag not found'
            });
        }

        const tasks = await Task.find({
            tags: req.params.id,
            user: req.user.id
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: tasks.length,
            data: tasks
        });
    } catch (error) {
        console.error('Error getting tag tasks:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};