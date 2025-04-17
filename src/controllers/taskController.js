// src/controllers/taskController.js
const Task = require('../models/Task');
const Category = require('../models/Category');
const Tag = require('../models/Tag');
const mongoose = require('mongoose');

// Helper function to validate object IDs
const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

// Helper function to validate and get category
const validateCategory = async (categoryId, userId) => {
    if (!categoryId) return null;

    if (!isValidObjectId(categoryId)) {
        throw new Error('Invalid category ID');
    }

    const category = await Category.findOne({
        _id: categoryId,
        user: userId
    });

    if (!category) {
        throw new Error('Category not found or does not belong to user');
    }

    return categoryId;
};

// Helper function to validate and get tags
const validateTags = async (tagIds, userId) => {
    if (!tagIds || !Array.isArray(tagIds) || tagIds.length === 0) {
        return [];
    }

    // Validate each tag ID
    for (const tagId of tagIds) {
        if (!isValidObjectId(tagId)) {
            throw new Error('Invalid tag ID');
        }
    }

    // Check if all tags belong to the user
    const tags = await Tag.find({
        _id: { $in: tagIds },
        user: userId
    });

    if (tags.length !== tagIds.length) {
        throw new Error('One or more tags not found or do not belong to user');
    }

    return tagIds;
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

// Get all tasks
exports.getTasks = async (req, res) => {
    try {
        // Build filter object
        const filter = { user: req.user.id };

        // Filter by status if provided
        if (req.query.status) {
            filter.status = req.query.status;
        }

        // Filter by priority if provided
        if (req.query.priority) {
            filter.priority = req.query.priority;
        }

        // Filter by category if provided
        if (req.query.category) {
            if (req.query.category === 'null') {
                filter.category = null;
            } else if (isValidObjectId(req.query.category)) {
                filter.category = req.query.category;
            }
        }

        // Filter by tag if provided
        if (req.query.tag && isValidObjectId(req.query.tag)) {
            filter.tags = req.query.tag;
        }

        // Filter by due date
        if (req.query.dueDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (req.query.dueDate === 'today') {
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                filter.dueDate = { $gte: today, $lt: tomorrow };
            } else if (req.query.dueDate === 'upcoming') {
                const nextWeek = new Date(today);
                nextWeek.setDate(nextWeek.getDate() + 7);
                filter.dueDate = { $gte: today, $lt: nextWeek };
            } else if (req.query.dueDate === 'overdue') {
                filter.dueDate = { $lt: today };
                filter.status = { $ne: 'completed' };
            }
        }

        // Filter by parent task or top-level tasks
        if (req.query.parent) {
            if (req.query.parent === 'null') {
                // Get only top-level tasks (no parent)
                filter.parent = null;
            } else if (isValidObjectId(req.query.parent)) {
                // Get subtasks of specific parent
                filter.parent = req.query.parent;
            }
        }

        // Get tasks
        const tasks = await Task.find(filter)
            .populate('category', 'name color icon')
            .populate('tags', 'name color')
            .sort({ createdAt: -1 });

        // Calculate subtask progress for each task
        const tasksWithProgress = await Promise.all(tasks.map(async (task) => {
            const taskObj = task.toObject();

            // Count subtasks
            const totalSubtasks = await Task.countDocuments({
                parent: task._id,
                user: req.user.id
            });

            if (totalSubtasks > 0) {
                // Count completed subtasks
                const completedSubtasks = await Task.countDocuments({
                    parent: task._id,
                    user: req.user.id,
                    status: 'completed'
                });

                taskObj.subtaskCount = totalSubtasks;
                taskObj.subtaskProgress = Math.round((completedSubtasks / totalSubtasks) * 100);
            } else {
                taskObj.subtaskCount = 0;
                taskObj.subtaskProgress = 0;
            }

            return taskObj;
        }));

        res.status(200).json({
            success: true,
            count: tasksWithProgress.length,
            data: tasksWithProgress
        });
    } catch (error) {
        console.error('Error getting tasks:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// Create a new task
exports.createTask = async (req, res) => {
    try {
        const {
            title,
            description,
            status,
            priority,
            dueDate,
            category,
            tags,
            parent
        } = req.body;

        // Validate category if provided
        let validatedCategoryId = null;
        if (category) {
            try {
                validatedCategoryId = await validateCategory(category, req.user.id);
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }
        }

        // Validate tags if provided
        let validatedTagIds = [];
        if (tags) {
            try {
                validatedTagIds = await validateTags(tags, req.user.id);
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }
        }

        // Validate parent if provided
        let validatedParentId = null;
        if (parent) {
            if (!isValidObjectId(parent)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid parent task ID'
                });
            }

            // Check if parent task exists and belongs to the user
            const parentTask = await Task.findOne({
                _id: parent,
                user: req.user.id
            });

            if (!parentTask) {
                return res.status(404).json({
                    success: false,
                    error: 'Parent task not found or does not belong to you'
                });
            }

            validatedParentId = parent;
        }

        // Create task
        const task = await Task.create({
            title,
            description,
            status: status || 'todo',
            priority: priority || 'medium',
            dueDate: dueDate || null,
            user: req.user.id,
            category: validatedCategoryId,
            tags: validatedTagIds,
            parent: validatedParentId
        });

        // Populate category and tags for response
        await task.populate('category', 'name color icon');
        await task.populate('tags', 'name color');

        res.status(201).json({
            success: true,
            data: task
        });
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// Get single task
exports.getTask = async (req, res) => {
    try {
        const task = await Task.findOne({
            _id: req.params.id,
            user: req.user.id
        })
            .populate('category', 'name color icon')
            .populate('tags', 'name color')
            .populate({
                path: 'subtasks',
                select: 'title status priority dueDate completedAt',
                options: { sort: { createdAt: 1 } }
            });

        if (!task) {
            return res.status(404).json({
                success: false,
                error: 'Task not found'
            });
        }

        // Calculate subtask progress
        let subtaskProgress = 0;
        if (task.subtasks && task.subtasks.length > 0) {
            const completedSubtasks = task.subtasks.filter(
                subtask => subtask.status === 'completed'
            ).length;

            subtaskProgress = Math.round((completedSubtasks / task.subtasks.length) * 100);
        }

        // Add subtask progress to response
        const taskWithProgress = {
            ...task.toObject(),
            subtaskProgress
        };

        res.status(200).json({
            success: true,
            data: taskWithProgress
        });
    } catch (error) {
        console.error('Error getting task:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// Update task
exports.updateTask = async (req, res) => {
    try {
        const {
            title,
            description,
            status,
            priority,
            dueDate,
            category,
            tags,
            parent
        } = req.body;

        // Find task
        let task = await Task.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                error: 'Task not found'
            });
        }

        // Update basic fields if provided
        if (title) task.title = title;
        if (description !== undefined) task.description = description;
        if (status) task.status = status;
        if (priority) task.priority = priority;
        if (dueDate !== undefined) task.dueDate = dueDate || null;

        // Update completedAt based on status
        if (status === 'completed' && task.status !== 'completed') {
            task.completedAt = new Date();
        } else if (status && status !== 'completed') {
            task.completedAt = null;
        }

        // Validate and update category if provided
        if (category !== undefined) {
            try {
                if (category === null || category === '') {
                    task.category = null;
                } else {
                    task.category = await validateCategory(category, req.user.id);
                }
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }
        }

        // Validate and update tags if provided
        if (tags !== undefined) {
            try {
                task.tags = await validateTags(tags, req.user.id);
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }
        }

        // Handle parent updates
        if (parent !== undefined) {
            // Removing parent (making it a top-level task)
            if (parent === null || parent === '') {
                task.parent = null;
            }
            // Setting a parent
            else {
                if (!isValidObjectId(parent)) {
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid parent task ID'
                    });
                }

                // Don't update if parent is unchanged
                if (!task.parent || task.parent.toString() !== parent) {
                    // Check if parent task exists and belongs to the user
                    const parentTask = await Task.findOne({
                        _id: parent,
                        user: req.user.id
                    });

                    if (!parentTask) {
                        return res.status(404).json({
                            success: false,
                            error: 'Parent task not found or does not belong to you'
                        });
                    }

                    // Check for circular references
                    const hasCircularRef = await checkForCircularReference(
                        task._id,
                        parent
                    );

                    if (hasCircularRef) {
                        return res.status(400).json({
                            success: false,
                            error: 'Cannot create circular reference in task hierarchy'
                        });
                    }

                    task.parent = parent;
                }
            }
        }

        // Save task
        await task.save();

        // Populate for response
        await task.populate('category', 'name color icon');
        await task.populate('tags', 'name color');
        await task.populate({
            path: 'subtasks',
            select: 'title status priority dueDate completedAt',
            options: { sort: { createdAt: 1 } }
        });

        // Calculate subtask progress
        let subtaskProgress = 0;
        if (task.subtasks && task.subtasks.length > 0) {
            const completedSubtasks = task.subtasks.filter(
                subtask => subtask.status === 'completed'
            ).length;

            subtaskProgress = Math.round((completedSubtasks / task.subtasks.length) * 100);
        }

        // Add subtask progress to response
        const taskWithProgress = {
            ...task.toObject(),
            subtaskProgress
        };

        res.status(200).json({
            success: true,
            data: taskWithProgress
        });
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// Delete task
exports.deleteTask = async (req, res) => {
    try {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const task = await Task.findOne({
                _id: req.params.id,
                user: req.user.id
            }).session(session);

            if (!task) {
                await session.abortTransaction();
                session.endSession();
                return res.status(404).json({
                    success: false,
                    error: 'Task not found'
                });
            }

            // Check if task has subtasks
            const subtasksCount = await Task.countDocuments({
                parent: req.params.id
            }).session(session);

            if (subtasksCount > 0) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({
                    success: false,
                    error: 'Cannot delete task with subtasks. Please delete subtasks first or use force delete.'
                });
            }

            await task.deleteOne({ session });

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
        console.error('Error deleting task:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// Force delete task and all its subtasks
exports.forceDeleteTask = async (req, res) => {
    try {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const task = await Task.findOne({
                _id: req.params.id,
                user: req.user.id
            }).session(session);

            if (!task) {
                await session.abortTransaction();
                session.endSession();
                return res.status(404).json({
                    success: false,
                    error: 'Task not found'
                });
            }

            // Delete all subtasks recursively (this is a simplified approach)
            // In a production environment, you might want to handle deeper nesting
            await Task.deleteMany({
                parent: req.params.id,
                user: req.user.id
            }).session(session);

            // Delete the task itself
            await task.deleteOne({ session });

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
        console.error('Error force deleting task:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// Add or remove tag from task
exports.updateTaskTags = async (req, res) => {
    try {
        const { operation, tagId } = req.body;

        if (!['add', 'remove'].includes(operation)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid operation. Use "add" or "remove"'
            });
        }

        if (!isValidObjectId(tagId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid tag ID'
            });
        }

        // Verify tag belongs to user
        const tag = await Tag.findOne({
            _id: tagId,
            user: req.user.id
        });

        if (!tag) {
            return res.status(404).json({
                success: false,
                error: 'Tag not found or does not belong to user'
            });
        }

        // Find task
        const task = await Task.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                error: 'Task not found'
            });
        }

        // Add or remove tag
        if (operation === 'add') {
            // Check if tag already exists in task tags
            if (!task.tags.includes(tagId)) {
                task.tags.push(tagId);
            }
        } else {
            // Remove tag from task tags
            task.tags = task.tags.filter(id => id.toString() !== tagId);
        }

        await task.save();

        // Populate for response
        await task.populate('tags', 'name color');

        res.status(200).json({
            success: true,
            data: task
        });
    } catch (error) {
        console.error('Error updating task tags:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};