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