// src/models/Category.js
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    color: {
        type: String,
        default: '#3498db'
    },
    icon: {
        type: String,
        default: 'folder'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isDefault: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Compound index for unique categories per user
categorySchema.index({ name: 1, user: 1 }, { unique: true });

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;