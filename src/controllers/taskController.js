// src/controllers/taskController.js
const Task = require('../models/Task');

// Get all tasks for the current user
exports.getTasks = async (req, res, next) => {
    try {
        const tasks = await Task.find({ user: req.user._id });
        res.json(tasks);
    } catch (error) {
        next(error);
    }
};

// Get a single task
exports.getTask = async (req, res, next) => {
    try {
        const task = await Task.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.json(task);
    } catch (error) {
        next(error);
    }
};

// Create a new task
exports.createTask = async (req, res, next) => {
    try {
        const newTask = new Task({
            ...req.body,
            user: req.user._id
        });

        const savedTask = await newTask.save();
        res.status(201).json(savedTask);
    } catch (error) {
        next(error);
    }
};

// Update a task
exports.updateTask = async (req, res, next) => {
    try {
        const task = await Task.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.json(task);
    } catch (error) {
        next(error);
    }
};

// Delete a task
exports.deleteTask = async (req, res, next) => {
    try {
        const task = await Task.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id
        });

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.json({ message: 'Task removed' });
    } catch (error) {
        next(error);
    }
};

// Update task status
exports.updateTaskStatus = async (req, res, next) => {
    try {
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ message: 'Status is required' });
        }

        const task = await Task.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { status },
            { new: true }
        );

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.json(task);
    } catch (error) {
        next(error);
    }
};

// Get subtasks
exports.getSubtasks = async (req, res, next) => {
    try {
        const subtasks = await Task.find({
            parent: req.params.id,
            user: req.user._id
        });

        res.json(subtasks);
    } catch (error) {
        next(error);
    }
};

// Create subtask
exports.createSubtask = async (req, res, next) => {
    try {
        const newSubtask = new Task({
            ...req.body,
            user: req.user._id,
            parent: req.params.id
        });

        const savedSubtask = await newSubtask.save();
        res.status(201).json(savedSubtask);
    } catch (error) {
        next(error);
    }
};

// Get a tree of tasks with their subtasks
exports.getTasksWithSubtasks = async (req, res, next) => {
    try {
        // Get all parent tasks (tasks with no parent)
        const parentTasks = await Task.find({
            user: req.user._id,
            parent: null
        });

        // For each parent task, fetch its subtasks
        const tasksWithSubtasks = await Promise.all(
            parentTasks.map(async (task) => {
                const subtasks = await Task.find({
                    user: req.user._id,
                    parent: task._id
                });

                return {
                    ...task.toObject(),
                    subtasks
                };
            })
        );

        res.json(tasksWithSubtasks);
    } catch (error) {
        next(error);
    }
};

// Update a subtask's parent
exports.updateTaskParent = async (req, res, next) => {
    try {
        const { parentId } = req.body;

        // Validate if parent exists if parentId is provided
        if (parentId) {
            const parentTask = await Task.findOne({
                _id: parentId,
                user: req.user._id
            });

            if (!parentTask) {
                return res.status(404).json({ message: 'Parent task not found' });
            }

            // Prevent circular references
            if (parentId === req.params.id) {
                return res.status(400).json({ message: 'Task cannot be its own parent' });
            }
        }

        const task = await Task.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { parent: parentId || null },
            { new: true }
        );

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.json(task);
    } catch (error) {
        next(error);
    }
};

// Delete a task and all its subtasks
exports.deleteTaskWithSubtasks = async (req, res, next) => {
    try {
        // Start a session for transaction
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Find the task
            const task = await Task.findOne({
                _id: req.params.id,
                user: req.user._id
            }).session(session);

            if (!task) {
                await session.abortTransaction();
                session.endSession();
                return res.status(404).json({ message: 'Task not found' });
            }

            // Delete all subtasks recursively
            await deleteSubtasksRecursive(req.params.id, req.user._id, session);

            // Delete the task itself
            await Task.findByIdAndDelete(req.params.id).session(session);

            await session.commitTransaction();
            session.endSession();

            res.json({ message: 'Task and all subtasks removed' });
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    } catch (error) {
        next(error);
    }
};

// Helper function to recursively delete subtasks
async function deleteSubtasksRecursive(taskId, userId, session) {
    // Find all direct subtasks
    const subtasks = await Task.find({
        parent: taskId,
        user: userId
    }).session(session);

    // For each subtask, delete its subtasks recursively
    for (const subtask of subtasks) {
        await deleteSubtasksRecursive(subtask._id, userId, session);
        await Task.findByIdAndDelete(subtask._id).session(session);
    }
}

// Duplicate a task with optional subtasks
exports.duplicateTask = async (req, res, next) => {
    try {
        const { withSubtasks = false } = req.body;

        // Find the original task
        const originalTask = await Task.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!originalTask) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Create a new task with the same properties
        const taskData = originalTask.toObject();
        delete taskData._id;
        delete taskData.createdAt;
        delete taskData.updatedAt;

        // Add "Copy of" to the title
        taskData.title = `Copy of ${taskData.title}`;

        const newTask = new Task(taskData);
        await newTask.save();

        // If withSubtasks is true, duplicate all subtasks
        if (withSubtasks) {
            await duplicateSubtasksRecursive(originalTask._id, newTask._id, req.user._id);
        }

        res.status(201).json(newTask);
    } catch (error) {
        next(error);
    }
};

// Helper function to recursively duplicate subtasks
async function duplicateSubtasksRecursive(originalParentId, newParentId, userId) {
    // Find all direct subtasks of the original parent
    const subtasks = await Task.find({
        parent: originalParentId,
        user: userId
    });

    // Duplicate each subtask
    for (const subtask of subtasks) {
        const subtaskData = subtask.toObject();
        delete subtaskData._id;
        delete subtaskData.createdAt;
        delete subtaskData.updatedAt;

        // Set the new parent
        subtaskData.parent = newParentId;

        const newSubtask = new Task(subtaskData);
        await newSubtask.save();

        // Recursively duplicate this subtask's subtasks
        await duplicateSubtasksRecursive(subtask._id, newSubtask._id, userId);
    }
}