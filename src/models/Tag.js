// src/models/Tag.js
const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    color: {
        type: String,
        default: '#3498db'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

// Compound index for unique tags per user
tagSchema.index({ name: 1, user: 1 }, { unique: true });

const Tag = mongoose.model('Tag', tagSchema);

module.exports = Tag;