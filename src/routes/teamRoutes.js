// src/routes/teamRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    isTeamMember,
    isTeamManager,
    isTeamOwner
} = require('../middleware/projectMiddleware');
const {
    getTeams,
    createTeam,
    getTeam,
    updateTeam,
    deleteTeam,
    getTeamMembers,
    addTeamMember,
    removeTeamMember,
    updateMemberRole,
    getTeamProjects,
    createTeamProject
} = require('../controllers/teamController');

// Route: /api/teams
router
    .route('/')
    .get(protect, getTeams)
    .post(protect, createTeam);

// Route: /api/teams/:id
router
    .route('/:id')
    .get(protect, isTeamMember, getTeam)
    .put(protect, isTeamManager, updateTeam)
    .delete(protect, isTeamOwner, deleteTeam);

// Route: /api/teams/:id/members
router
    .route('/:id/members')
    .get(protect, isTeamMember, getTeamMembers)
    .post(protect, isTeamManager, addTeamMember);

// Route: /api/teams/:id/members/:userId
router
    .route('/:id/members/:userId')
    .delete(protect, isTeamManager, removeTeamMember)
    .patch(protect, isTeamOwner, updateMemberRole);

// Route: /api/teams/:id/projects
router
    .route('/:id/projects')
    .get(protect, isTeamMember, getTeamProjects)
    .post(protect, isTeamManager, createTeamProject);

module.exports = router;