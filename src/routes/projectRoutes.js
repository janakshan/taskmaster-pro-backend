// src/routes/projectRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    isProjectMember,
    isProjectManager,
    isProjectOwner
} = require('../middleware/projectMiddleware');
const {
    getProjects,
    createProject,
    getProject,
    updateProject,
    deleteProject,
    getProjectTasks,
    addProjectMember,
    removeProjectMember,
    updateMemberRole
} = require('../controllers/projectController');

// Route: /api/projects
router
    .route('/')
    .get(protect, getProjects)
    .post(protect, createProject);

// Route: /api/projects/:id
router
    .route('/:id')
    .get(protect, isProjectMember, getProject)
    .put(protect, isProjectManager, updateProject)
    .delete(protect, isProjectOwner, deleteProject);

// Route: /api/projects/:id/tasks
router
    .route('/:id/tasks')
    .get(protect, isProjectMember, getProjectTasks);

// Route: /api/projects/:id/members
router
    .route('/:id/members')
    .post(protect, isProjectManager, addProjectMember);

// Route: /api/projects/:id/members/:userId
router
    .route('/:id/members/:userId')
    .delete(protect, isProjectManager, removeProjectMember)
    .patch(protect, isProjectOwner, updateMemberRole);

module.exports = router;