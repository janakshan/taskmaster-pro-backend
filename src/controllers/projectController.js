// src/controllers/projectController.js
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

/**
 * @desc    Get all projects for the authenticated user
 * @route   GET /api/projects
 * @access  Private
 */
exports.getProjects = async (req, res, next) => {
    try {
        // Get projects where user is a member
        const projects = await Project.find({
            'members.user': req.user._id
        }).sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            count: projects.length,
            data: projects
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create a new project
 * @route   POST /api/projects
 * @access  Private
 */
exports.createProject = async (req, res, next) => {
    try {
        const { name, description, color, icon, startDate, endDate, isPrivate } = req.body;

        // Create project with current user as owner
        const project = await Project.create({
            name,
            description,
            color,
            icon,
            startDate,
            endDate,
            isPrivate,
            owner: req.user._id,
            members: [{ user: req.user._id, role: 'owner' }]
        });

        res.status(201).json({
            success: true,
            data: project
        });
    } catch (error) {
        // Handle duplicate project name
        if (error.code === 11000) {
            return next(new ApiError('Project with that name already exists', 400));
        }
        next(error);
    }
};

/**
 * @desc    Get a single project
 * @route   GET /api/projects/:id
 * @access  Private
 */
exports.getProject = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('members.user', 'name email avatar')
            .populate('owner', 'name email avatar');

        if (!project) {
            return next(new ApiError('Project not found', 404));
        }

        // Check if user is a member of the project
        if (!project.isMember(req.user._id)) {
            return next(new ApiError('Not authorized to access this project', 403));
        }

        res.status(200).json({
            success: true,
            data: project
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update a project
 * @route   PUT /api/projects/:id
 * @access  Private
 */
exports.updateProject = async (req, res, next) => {
    try {
        const { name, description, color, icon, startDate, endDate, status, isPrivate } = req.body;

        let project = await Project.findById(req.params.id);

        if (!project) {
            return next(new ApiError('Project not found', 404));
        }

        // Check if user is owner or admin
        if (!project.isManagerOrOwner(req.user._id)) {
            return next(new ApiError('Not authorized to update this project', 403));
        }

        // Update fields
        project = await Project.findByIdAndUpdate(
            req.params.id,
            {
                name,
                description,
                color,
                icon,
                startDate,
                endDate,
                status,
                isPrivate
            },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: project
        });
    } catch (error) {
        // Handle duplicate project name
        if (error.code === 11000) {
            return next(new ApiError('Project with that name already exists', 400));
        }
        next(error);
    }
};

/**
 * @desc    Delete a project
 * @route   DELETE /api/projects/:id
 * @access  Private
 */
exports.deleteProject = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return next(new ApiError('Project not found', 404));
        }

        // Check if user is the project owner
        if (project.owner.toString() !== req.user._id.toString()) {
            return next(new ApiError('Only the project owner can delete this project', 403));
        }

        // Remove project from all tasks
        await Task.updateMany(
            { project: project._id },
            { $unset: { project: "" } }
        );

        // Delete the project
        await project.remove();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all tasks for a project
 * @route   GET /api/projects/:id/tasks
 * @access  Private
 */
exports.getProjectTasks = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return next(new ApiError('Project not found', 404));
        }

        // Check if user is a member of the project
        if (!project.isMember(req.user._id)) {
            return next(new ApiError('Not authorized to access this project', 403));
        }

        // Get all tasks for this project
        const tasks = await Task.find({ project: project._id })
            .populate('category')
            .populate('tags')
            .sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            count: tasks.length,
            data: tasks
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Add a member to a project
 * @route   POST /api/projects/:id/members
 * @access  Private
 */
exports.addProjectMember = async (req, res, next) => {
    try {
        const { email, role } = req.body;

        // Find the project
        const project = await Project.findById(req.params.id);

        if (!project) {
            return next(new ApiError('Project not found', 404));
        }

        // Check if user is owner or admin
        if (!project.isManagerOrOwner(req.user._id)) {
            return next(new ApiError('Not authorized to add members to this project', 403));
        }

        // Find the user by email
        const userToAdd = await User.findOne({ email });

        if (!userToAdd) {
            return next(new ApiError('User not found', 404));
        }

        // Check if user is already a member
        if (project.members.some(member => member.user.toString() === userToAdd._id.toString())) {
            return next(new ApiError('User is already a member of this project', 400));
        }

        // Add user to project members
        project.members.push({
            user: userToAdd._id,
            role: role || 'member'
        });

        await project.save();

        res.status(200).json({
            success: true,
            data: project
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Remove a member from a project
 * @route   DELETE /api/projects/:id/members/:userId
 * @access  Private
 */
exports.removeProjectMember = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return next(new ApiError('Project not found', 404));
        }

        // Check if user is owner or admin
        if (!project.isManagerOrOwner(req.user._id)) {
            return next(new ApiError('Not authorized to remove members from this project', 403));
        }

        // Cannot remove the owner
        if (project.owner.toString() === req.params.userId) {
            return next(new ApiError('Cannot remove the project owner', 400));
        }

        // Check if user to remove exists in project
        const memberIndex = project.members.findIndex(
            member => member.user.toString() === req.params.userId
        );

        if (memberIndex === -1) {
            return next(new ApiError('User is not a member of this project', 404));
        }

        // Remove member
        project.members.splice(memberIndex, 1);
        await project.save();

        res.status(200).json({
            success: true,
            data: project
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update a member's role in a project
 * @route   PATCH /api/projects/:id/members/:userId
 * @access  Private
 */
exports.updateMemberRole = async (req, res, next) => {
    try {
        const { role } = req.body;

        if (!role || !['owner', 'admin', 'member'].includes(role)) {
            return next(new ApiError('Invalid role specified', 400));
        }

        const project = await Project.findById(req.params.id);

        if (!project) {
            return next(new ApiError('Project not found', 404));
        }

        // Only owner can change roles
        if (project.owner.toString() !== req.user._id.toString()) {
            return next(new ApiError('Only the project owner can change member roles', 403));
        }

        // Cannot change the owner's role
        if (project.owner.toString() === req.params.userId && role !== 'owner') {
            return next(new ApiError('Cannot change the project owner\'s role', 400));
        }

        // Find the member and update role
        const memberIndex = project.members.findIndex(
            member => member.user.toString() === req.params.userId
        );

        if (memberIndex === -1) {
            return next(new ApiError('User is not a member of this project', 404));
        }

        // If changing to owner, update the owner field and previous owner's role
        if (role === 'owner') {
            // Find the current owner's member object
            const currentOwnerIndex = project.members.findIndex(
                member => member.user.toString() === project.owner.toString()
            );

            if (currentOwnerIndex !== -1) {
                project.members[currentOwnerIndex].role = 'admin';
            }

            // Update project owner
            project.owner = req.params.userId;
        }

        // Update the member's role
        project.members[memberIndex].role = role;
        await project.save();

        res.status(200).json({
            success: true,
            data: project
        });
    } catch (error) {
        next(error);
    }
};