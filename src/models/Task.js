// src/models/Task.js
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['backlog', 'todo', 'in_progress', 'review', 'completed', 'archived'],
        default: 'todo'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    dueDate: {
        type: Date
    },
    completedAt: {
        type: Date
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Add category field referencing Category model
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    // Add tags array referencing Tag model
    tags: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tag'
    }],
    // Project association
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        default: null
    },
    // Assignees for collaborative tasks
    assignees: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ['responsible', 'accountable', 'consulted', 'informed'],
            default: 'responsible'
        }
    }],
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        default: null
    },
    // Time tracking
    estimatedTime: {
        type: Number, // in minutes
        default: 0
    },
    actualTime: {
        type: Number, // in minutes
        default: 0
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for subtasks
taskSchema.virtual('subtasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'parent'
});

// Indexes for better query performance
taskSchema.index({ user: 1, status: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ category: 1 });
taskSchema.index({ tags: 1 });
taskSchema.index({ project: 1 });
taskSchema.index({ 'assignees.user': 1 });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;