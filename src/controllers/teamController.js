// src/controllers/teamController.js
const Team = require('../models/Team');
const Project = require('../models/Project');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

/**
 * @desc    Get all teams for the authenticated user
 * @route   GET /api/teams
 * @access  Private
 */

exports.getTeams = async (req, res, next) => {
    try {
        // Get teams where user is a member
        const teams = await Team.find({
            'members.user': req.user._id
        }).sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            count: teams.length,
            data: teams
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create a new team
 * @route   POST /api/teams
 * @access  Private
 */
exports.createTeam = async (req, res, next) => {
    try {
        const { name, description, avatar, isPrivate } = req.body;

        // Create team with current user as owner
        const team = await Team.create({
            name,
            description,
            avatar,
            isPrivate,
            owner: req.user._id,
            members: [{ user: req.user._id, role: 'owner' }]
        });

        res.status(201).json({
            success: true,
            data: team
        });
    } catch (error) {
        // Handle duplicate team name
        if (error.code === 11000) {
            return next(new ApiError('Team with that name already exists', 400));
        }
        next(error);
    }
};

/**
 * @desc    Get a single team
 * @route   GET /api/teams/:id
 * @access  Private
 */
exports.getTeam = async (req, res, next) => {
    try {
        const team = await Team.findById(req.params.id)
            .populate('members.user', 'name email avatar')
            .populate('owner', 'name email avatar');

        if (!team) {
            return next(new ApiError('Team not found', 404));
        }

        // Add debugging
        console.log('team', team);
        console.log('user._id', req.user._id);

        // Check if user is a member of the team
        if (!team.isMember(req.user._id)) {
            return next(new ApiError('Not authorized to access this team', 403));
        }

        res.status(200).json({
            success: true,
            data: team
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update a team
 * @route   PUT /api/teams/:id
 * @access  Private
 */
exports.updateTeam = async (req, res, next) => {
    try {
        const { name, description, avatar, isPrivate } = req.body;

        let team = await Team.findById(req.params.id);

        if (!team) {
            return next(new ApiError('Team not found', 404));
        }

        // Check if user is owner or admin
        if (!team.isManagerOrOwner(req.user._id)) {
            return next(new ApiError('Not authorized to update this team', 403));
        }

        // Update fields
        team = await Team.findByIdAndUpdate(
            req.params.id,
            {
                name,
                description,
                avatar,
                isPrivate
            },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: team
        });
    } catch (error) {
        // Handle duplicate team name
        if (error.code === 11000) {
            return next(new ApiError('Team with that name already exists', 400));
        }
        next(error);
    }
};

/**
 * @desc    Delete a team
 * @route   DELETE /api/teams/:id
 * @access  Private
 */
exports.deleteTeam = async (req, res, next) => {
    try {
        const team = await Team.findById(req.params.id);

        if (!team) {
            return next(new ApiError('Team not found', 404));
        }

        // Check if user is the team owner
        if (team.owner.toString() !== req.user._id.toString()) {
            return next(new ApiError('Only the team owner can delete this team', 403));
        }

        // Update all projects to remove team reference
        await Project.updateMany(
            { team: team._id },
            { $unset: { team: "" } }
        );

        // Delete the team - CHANGE THIS LINE
        await team.deleteOne(); // Instead of team.remove()

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all members of a team
 * @route   GET /api/teams/:id/members
 * @access  Private
 */
exports.getTeamMembers = async (req, res, next) => {
    try {
        const team = await Team.findById(req.params.id)
            .populate('members.user', 'name email avatar')
            .select('members');

        if (!team) {
            return next(new ApiError('Team not found', 404));
        }

        console.log('Is member check:', team.members.map(m => m.user.toString()), req.user._id.toString());

        // Check if user is a member of the team
        if (!team.isMember(req.user._id)) {
            return next(new ApiError('Not authorized to access this team', 403));
        }

        res.status(200).json({
            success: true,
            count: team.members.length,
            data: team.members
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Add a member to a team
 * @route   POST /api/teams/:id/members
 * @access  Private
 */
exports.addTeamMember = async (req, res, next) => {
    try {
        const { email, role } = req.body;

        // Find the team
        const team = await Team.findById(req.params.id);

        if (!team) {
            return next(new ApiError('Team not found', 404));
        }

        // Check if user is owner or admin
        if (!team.isManagerOrOwner(req.user._id)) {
            return next(new ApiError('Not authorized to add members to this team', 403));
        }

        // Find the user by email
        const userToAdd = await User.findOne({ email });

        if (!userToAdd) {
            return next(new ApiError('User not found', 404));
        }

        // Check if user is already a member
        if (team.members.some(member => member.user.toString() === userToAdd._id.toString())) {
            return next(new ApiError('User is already a member of this team', 400));
        }

        // Add user to team members
        team.members.push({
            user: userToAdd._id,
            role: role || 'member'
        });

        await team.save();

        res.status(200).json({
            success: true,
            data: team
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Remove a member from a team
 * @route   DELETE /api/teams/:id/members/:userId
 * @access  Private
 */
exports.removeTeamMember = async (req, res, next) => {
    try {
        const team = await Team.findById(req.params.id);

        if (!team) {
            return next(new ApiError('Team not found', 404));
        }

        // Check if user is owner or admin
        if (!team.isManagerOrOwner(req.user._id)) {
            return next(new ApiError('Not authorized to remove members from this team', 403));
        }

        // Cannot remove the owner
        if (team.owner.toString() === req.params.userId) {
            return next(new ApiError('Cannot remove the team owner', 400));
        }

        // Check if user to remove exists in team
        const memberIndex = team.members.findIndex(
            member => member.user.toString() === req.params.userId
        );

        if (memberIndex === -1) {
            return next(new ApiError('User is not a member of this team', 404));
        }

        // Remove member
        team.members.splice(memberIndex, 1);
        await team.save();

        res.status(200).json({
            success: true,
            data: team
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update a member's role in a team
 * @route   PATCH /api/teams/:id/members/:userId
 * @access  Private
 */
exports.updateMemberRole = async (req, res, next) => {
    try {
        const { role } = req.body;

        if (!role || !['owner', 'admin', 'member'].includes(role)) {
            return next(new ApiError('Invalid role specified', 400));
        }

        const team = await Team.findById(req.params.id);

        if (!team) {
            return next(new ApiError('Team not found', 404));
        }

        // Only owner can change roles
        if (team.owner.toString() !== req.user._id.toString()) {
            return next(new ApiError('Only the team owner can change member roles', 403));
        }

        // Cannot change the owner's role
        if (team.owner.toString() === req.params.userId && role !== 'owner') {
            return next(new ApiError('Cannot change the team owner\'s role', 400));
        }

        // Find the member and update role
        const memberIndex = team.members.findIndex(
            member => member.user.toString() === req.params.userId
        );

        if (memberIndex === -1) {
            return next(new ApiError('User is not a member of this team', 404));
        }

        // If changing to owner, update the owner field and previous owner's role
        if (role === 'owner') {
            // Find the current owner's member object
            const currentOwnerIndex = team.members.findIndex(
                member => member.user.toString() === team.owner.toString()
            );

            if (currentOwnerIndex !== -1) {
                team.members[currentOwnerIndex].role = 'admin';
            }

            // Update team owner
            team.owner = req.params.userId;
        }

        // Update the member's role
        team.members[memberIndex].role = role;
        await team.save();

        res.status(200).json({
            success: true,
            data: team
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all projects for a team
 * @route   GET /api/teams/:id/projects
 * @access  Private
 */
exports.getTeamProjects = async (req, res, next) => {
    try {
        const team = await Team.findById(req.params.id);

        if (!team) {
            return next(new ApiError('Team not found', 404));
        }

        // Check if user is a member of the team
        if (!team.isMember(req.user._id)) {
            return next(new ApiError('Not authorized to access this team', 403));
        }

        // Get all projects for this team
        const projects = await Project.find({ team: team._id })
            .sort({ updatedAt: -1 });

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
 * @desc    Create a project for a team
 * @route   POST /api/teams/:id/projects
 * @access  Private
 */
exports.createTeamProject = async (req, res, next) => {
    try {
        const { name, description, color, icon, startDate, endDate, isPrivate } = req.body;

        // Find the team
        const team = await Team.findById(req.params.id);

        if (!team) {
            return next(new ApiError('Team not found', 404));
        }

        // Check if user is owner or admin of the team
        if (!team.isManagerOrOwner(req.user._id)) {
            return next(new ApiError('Not authorized to create projects for this team', 403));
        }

        // Create project
        const project = await Project.create({
            name,
            description,
            color,
            icon,
            startDate,
            endDate,
            isPrivate,
            owner: req.user._id,
            team: team._id,
            members: team.members.map(member => ({
                user: member.user,
                role: member.role
            }))
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