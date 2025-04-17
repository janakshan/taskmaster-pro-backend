// src/controllers/subtaskController.js
const Task = require('../models/Task');
const mongoose = require('mongoose');

// Helper function to validate object IDs
const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

// Helper function to check for circular references
const checkForCircularReference = async (childId, potentialParentId) => {
    // If we're trying to set a parent to itself
    if (childId.toString() === potentialParentId.toString()) {
        return true;
    }

    // Check if the potential parent is a descendant of the child
    // This prevents creating loops in the task hierarchy
    let currentId = potentialParentId;
    const visitedIds = new Set();

    while (currentId) {
        // If we've already visited this ID, there's a loop
        if (visitedIds.has(currentId.toString())) {
            return true;
        }

        visitedIds.add(currentId.toString());

        // Find the parent of the current task
        const currentTask = await Task.findById(currentId).select('parent');
        if (!currentTask || !currentTask.parent) {
            // No parent or task not found, so no circular reference
            break;
        }

        // If the parent is the child we're checking, there's a circular reference
        if (currentTask.parent.toString() === childId.toString()) {
            return true;
        }

        // Move up to the next parent
        currentId = currentTask.parent;
    }

    return false;
};

// Get all subtasks for a task
exports.getSubtasks = async (req, res) => {
    try {
        const parentTask = await Task.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!parentTask) {
            return res.status(404).json({
                success: false,
                error: 'Parent task not found'
            });
        }

        const subtasks = await Task.find({
            parent: req.params.id,
            user: req.user.id
        })
            .populate('category', 'name color icon')
            .populate('tags', 'name color')
            .sort({ createdAt: 1 });

        res.status(200).json({
            success: true,
            count: subtasks.length,
            data: subtasks
        });
    } catch (error) {
        console.error('Error getting subtasks:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// Create a subtask
exports.createSubtask = async (req, res) => {
    try {
        const parentTask = await Task.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!parentTask) {
            return res.status(404).json({
                success: false,
                error: 'Parent task not found'
            });
        }

        const { title, description, status, priority, dueDate, category, tags } = req.body;

        // Create subtask with parent reference
        const subtask = await Task.create({
            title,
            description,
            status: status || 'todo',
            priority: priority || 'medium',
            dueDate: dueDate || null,
            user: req.user.id,
            category: category || parentTask.category,
            tags: tags || [],
            parent: req.params.id
        });

        // Populate category and tags for response
        await subtask.populate('category', 'name color icon');
        await subtask.populate('tags', 'name color');

        res.status(201).json({
            success: true,
            data: subtask
        });
    } catch (error) {
        console.error('Error creating subtask:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// Get a specific subtask
exports.getSubtask = async (req, res) => {
    try {
        const subtask = await Task.findOne({
            _id: req.params.subtaskId,
            parent: req.params.id,
            user: req.user.id
        })
            .populate('category', 'name color icon')
            .populate('tags', 'name color');

        if (!subtask) {
            return res.status(404).json({
                success: false,
                error: 'Subtask not found'
            });
        }

        res.status(200).json({
            success: true,
            data: subtask
        });
    } catch (error) {
        console.error('Error getting subtask:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// Update a subtask
exports.updateSubtask = async (req, res) => {
    try {
        let subtask = await Task.findOne({
            _id: req.params.subtaskId,
            parent: req.params.id,
            user: req.user.id
        });

        if (!subtask) {
            return res.status(404).json({
                success: false,
                error: 'Subtask not found'
            });
        }

        const { title, description, status, priority, dueDate, category, tags } = req.body;

        // Update fields if provided
        if (title) subtask.title = title;
        if (description !== undefined) subtask.description = description;
        if (status) subtask.status = status;
        if (priority) subtask.priority = priority;
        if (dueDate !== undefined) subtask.dueDate = dueDate || null;
        if (category !== undefined) subtask.category = category || null;
        if (tags !== undefined) subtask.tags = tags;

        // Check if trying to update the parent
        if (req.body.parent !== undefined) {
            // If parent is being removed (set to null)
            if (!req.body.parent) {
                subtask.parent = null;
            }
            // If parent is being changed
            else if (isValidObjectId(req.body.parent)) {
                const newParentId = req.body.parent;

                // Check if new parent exists and belongs to user
                const newParent = await Task.findOne({
                    _id: newParentId,
                    user: req.user.id
                });

                if (!newParent) {
                    return res.status(404).json({
                        success: false,
                        error: 'New parent task not found'
                    });
                }

                // Check for circular references
                const hasCircularRef = await checkForCircularReference(
                    subtask._id,
                    newParentId
                );

                if (hasCircularRef) {
                    return res.status(400).json({
                        success: false,
                        error: 'Cannot create circular reference in task hierarchy'
                    });
                }

                subtask.parent = newParentId;
            }
        }

        // Update completedAt based on status
        if (status === 'completed' && subtask.status !== 'completed') {
            subtask.completedAt = new Date();
        } else if (status && status !== 'completed') {
            subtask.completedAt = null;
        }

        await subtask.save();

        // Populate for response
        await subtask.populate('category', 'name color icon');
        await subtask.populate('tags', 'name color');

        res.status(200).json({
            success: true,
            data: subtask
        });
    } catch (error) {
        console.error('Error updating subtask:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// Delete a subtask
exports.deleteSubtask = async (req, res) => {
    try {
        const subtask = await Task.findOne({
            _id: req.params.subtaskId,
            parent: req.params.id,
            user: req.user.id
        });

        if (!subtask) {
            return res.status(404).json({
                success: false,
                error: 'Subtask not found'
            });
        }

        // Check if the subtask has its own subtasks
        const hasSubtasks = await Task.findOne({ parent: subtask._id });
        if (hasSubtasks) {
            return res.status(400).json({
                success: false,
                error: 'Cannot delete subtask with its own subtasks. Please delete them first.'
            });
        }

        await subtask.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error('Error deleting subtask:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// Complete all subtasks
exports.completeAllSubtasks = async (req, res) => {
    try {
        const parentTask = await Task.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!parentTask) {
            return res.status(404).json({
                success: false,
                error: 'Parent task not found'
            });
        }

        // Update all subtasks to completed status
        await Task.updateMany(
            { parent: req.params.id, user: req.user.id },
            {
                status: 'completed',
                completedAt: new Date()
            }
        );

        // Get updated subtasks
        const subtasks = await Task.find({
            parent: req.params.id,
            user: req.user.id
        })
            .populate('category', 'name color icon')
            .populate('tags', 'name color');

        res.status(200).json({
            success: true,
            count: subtasks.length,
            data: subtasks
        });
    } catch (error) {
        console.error('Error completing all subtasks:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// Get subtask completion status
exports.getSubtaskStatus = async (req, res) => {
    try {
        const parentTask = await Task.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!parentTask) {
            return res.status(404).json({
                success: false,
                error: 'Parent task not found'
            });
        }

        // Get counts of total and completed subtasks
        const totalSubtasks = await Task.countDocuments({
            parent: req.params.id,
            user: req.user.id
        });

        const completedSubtasks = await Task.countDocuments({
            parent: req.params.id,
            user: req.user.id,
            status: 'completed'
        });

        const progress = totalSubtasks > 0
            ? Math.round((completedSubtasks / totalSubtasks) * 100)
            : 0;

        res.status(200).json({
            success: true,
            data: {
                total: totalSubtasks,
                completed: completedSubtasks,
                progress: progress
            }
        });
    } catch (error) {
        console.error('Error getting subtask status:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};