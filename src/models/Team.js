// src/models/Team.js
const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    avatar: {
        type: String
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
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

// Virtual for projects
teamSchema.virtual('projects', {
    ref: 'Project',
    localField: '_id',
    foreignField: 'team'
});

// Compound index for team name and owner
teamSchema.index({ name: 1, owner: 1 }, { unique: true });

// Method to check if user is a team member
teamSchema.methods.isMember = function (userId) {
    const userIdStr = userId.toString();

    // Handle both populated and non-populated user fields
    return this.members.some(member => {
        // Check if user is a populated object or just an ID
        const memberId = member.user._id ? member.user._id.toString() : member.user.toString();
        return memberId === userIdStr;
    });
};

// Method to check if user is a team owner or admin
teamSchema.methods.isManagerOrOwner = function (userId) {
    return this.members.some(member =>
        member.user.toString() === userId.toString() &&
        (member.role === 'owner' || member.role === 'admin')
    );
};

const Team = mongoose.model('Team', teamSchema);

module.exports = Team;