// src/middleware/projectMiddleware.js
const Project = require('../models/Project');
const Team = require('../models/Team');
const ApiError = require('../utils/ApiError');

/**
 * Middleware to check if user is a project member
 */
exports.isProjectMember = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return next(new ApiError('Project not found', 404));
        }

        if (!project.isMember(req.user._id)) {
            return next(new ApiError('Not authorized to access this project', 403));
        }

        // Add project to request object for future use
        req.project = project;
        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Middleware to check if user is a project manager or owner
 */
exports.isProjectManager = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return next(new ApiError('Project not found', 404));
        }

        if (!project.isManagerOrOwner(req.user._id)) {
            return next(new ApiError('Not authorized to manage this project', 403));
        }

        // Add project to request object for future use
        req.project = project;
        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Middleware to check if user is a project owner
 */
exports.isProjectOwner = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return next(new ApiError('Project not found', 404));
        }

        if (project.owner.toString() !== req.user._id.toString()) {
            return next(new ApiError('Not authorized, only the project owner can perform this action', 403));
        }

        // Add project to request object for future use
        req.project = project;
        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Middleware to check if user is a team member
 */
exports.isTeamMember = async (req, res, next) => {
    try {
        const team = await Team.findById(req.params.id);

        console.log('team', team)

        if (!team) {
            return next(new ApiError('Team not found', 404));
        }

        console.log('user._id', req.user._id)

        if (!team.isMember(req.user._id)) {
            return next(new ApiError('Not authorized to access this team', 403));
        }

        // Add team to request object for future use
        req.team = team;
        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Middleware to check if user is a team manager or owner
 */
exports.isTeamManager = async (req, res, next) => {
    try {
        const team = await Team.findById(req.params.id);

        if (!team) {
            return next(new ApiError('Team not found', 404));
        }

        if (!team.isManagerOrOwner(req.user._id)) {
            return next(new ApiError('Not authorized to manage this team', 403));
        }

        // Add team to request object for future use
        req.team = team;
        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Middleware to check if user is a team owner
 */
exports.isTeamOwner = async (req, res, next) => {
    try {
        const team = await Team.findById(req.params.id);

        if (!team) {
            return next(new ApiError('Team not found', 404));
        }

        if (team.owner.toString() !== req.user._id.toString()) {
            return next(new ApiError('Not authorized, only the team owner can perform this action', 403));
        }

        // Add team to request object for future use
        req.team = team;
        next();
    } catch (error) {
        next(error);
    }
};