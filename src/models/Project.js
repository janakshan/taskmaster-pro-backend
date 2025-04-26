// src/models/Project.js
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    color: {
        type: String,
        default: '#3498db'
    },
    icon: {
        type: String,
        default: 'briefcase'
    },
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['planning', 'active', 'on_hold', 'completed', 'cancelled'],
        default: 'planning'
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    members: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        role: {
            type: String,
            enum: ['owner', 'admin', 'member'],
            default: 'member'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    isPrivate: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for tasks
projectSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'project'
});

// Compound index for project name and owner
projectSchema.index({ name: 1, owner: 1 }, { unique: true });

// Update the isMember method in Project.js model
projectSchema.methods.isMember = function (userId) {
    const userIdStr = userId.toString();

    // Handle both populated and non-populated user fields
    return this.members.some(member => {
        // Check if user is a populated object or just an ID
        const memberId = member.user._id ? member.user._id.toString() : member.user.toString();
        return memberId === userIdStr;
    });
};

// Also update the isManagerOrOwner method
projectSchema.methods.isManagerOrOwner = function (userId) {
    const userIdStr = userId.toString();

    return this.members.some(member => {
        // Check if user is a populated object or just an ID
        const memberId = member.user._id ? member.user._id.toString() : member.user.toString();
        return memberId === userIdStr &&
            (member.role === 'owner' || member.role === 'admin');
    });
};
const Project = mongoose.model('Project', projectSchema);

module.exports = Project;