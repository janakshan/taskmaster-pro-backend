// src/controllers/categoryController.js
const Category = require('../models/Category');
const Task = require('../models/Task');
const mongoose = require('mongoose');

// Get all categories for a user
exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.find({ user: req.user.id }).sort({ name: 1 });
        res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Error getting categories:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// Create a new category
exports.createCategory = async (req, res) => {
    try {
        const { name, color, icon } = req.body;

        // Check if category already exists for this user
        const existingCategory = await Category.findOne({
            name: name,
            user: req.user.id
        });

        if (existingCategory) {
            return res.status(400).json({
                success: false,
                error: 'Category already exists'
            });
        }

        const category = await Category.create({
            name,
            color: color || '#3498db',
            icon: icon || 'folder',
            user: req.user.id
        });

        res.status(201).json({
            success: true,
            data: category
        });
    } catch (error) {
        console.error('Error creating category:', error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                error: 'Category already exists'
            });
        }
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// Get a single category
exports.getCategory = async (req, res) => {
    try {
        const category = await Category.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Category not found'
            });
        }

        res.status(200).json({
            success: true,
            data: category
        });
    } catch (error) {
        console.error('Error getting category:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// Update a category
exports.updateCategory = async (req, res) => {
    try {
        const { name, color, icon } = req.body;

        let category = await Category.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Category not found'
            });
        }

        // Only update fields that were actually passed
        if (name) category.name = name;
        if (color) category.color = color;
        if (icon) category.icon = icon;

        await category.save();

        res.status(200).json({
            success: true,
            data: category
        });
    } catch (error) {
        console.error('Error updating category:', error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                error: 'Category with this name already exists'
            });
        }
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// Delete a category
exports.deleteCategory = async (req, res) => {
    try {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Find category
            const category = await Category.findOne({
                _id: req.params.id,
                user: req.user.id
            }).session(session);

            if (!category) {
                await session.abortTransaction();
                session.endSession();
                return res.status(404).json({
                    success: false,
                    error: 'Category not found'
                });
            }

            // Check if it's a default category
            if (category.isDefault) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({
                    success: false,
                    error: 'Cannot delete default category'
                });
            }

            // Update tasks that use this category (set category to null)
            await Task.updateMany(
                { category: req.params.id },
                { $set: { category: null } },
                { session }
            );

            // Delete the category
            await Category.findByIdAndDelete(req.params.id).session(session);

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
        console.error('Error deleting category:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// Get tasks by category
exports.getCategoryTasks = async (req, res) => {
    try {
        const category = await Category.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Category not found'
            });
        }

        const tasks = await Task.find({
            category: req.params.id,
            user: req.user.id
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: tasks.length,
            data: tasks
        });
    } catch (error) {
        console.error('Error getting category tasks:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};