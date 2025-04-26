// src/controllers/taskController.js
const Task = require('../models/Task');
const Project = require('../models/Project');
const ApiError = require('../utils/ApiError');

/**
 * @desc    Get all tasks for the authenticated user
 * @route   GET /api/tasks
 * @access  Private
 */
exports.getTasks = async (req, res, next) => {
    try {
        // Build query
        const queryObj = {
            $or: [
                { user: req.user._id },
                { 'assignees.user': req.user._id }
            ]
        };

        // Handle filters
        if (req.query.status) {
            queryObj.status = req.query.status;
        }

        if (req.query.priority) {
            queryObj.priority = req.query.priority;
        }

        if (req.query.category) {
            queryObj.category = req.query.category;
        }

        if (req.query.project) {
            queryObj.project = req.query.project;
        }

        if (req.query.dueDate) {
            // Handle due date filtering
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (req.query.dueDate === 'today') {
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);

                queryObj.dueDate = {
                    $gte: today,
                    $lt: tomorrow
                };
            } else if (req.query.dueDate === 'upcoming') {
                const nextWeek = new Date(today);
                nextWeek.setDate(nextWeek.getDate() + 7);

                queryObj.dueDate = {
                    $gte: today,
                    $lt: nextWeek
                };
            } else if (req.query.dueDate === 'overdue') {
                queryObj.dueDate = { $lt: today };
                queryObj.status = { $ne: 'completed' };
            }
        }

        // Search term
        if (req.query.search) {
            queryObj.$or = [
                { title: { $regex: req.query.search, $options: 'i' } },
                { description: { $regex: req.query.search, $options: 'i' } },
            ];
        }

        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;

        // Execute query with pagination
        const tasks = await Task.find(queryObj)
            .populate('category', 'name color icon')
            .populate('tags', 'name color')
            .populate('project', 'name color icon')
            .populate('assignees.user', 'name avatar')
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit);

        // Get total count for pagination
        const total = await Task.countDocuments(queryObj);

        res.status(200).json({
            success: true,
            count: tasks.length,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            },
            data: tasks
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create a new task
 * @route   POST /api/tasks
 * @access  Private
 */
exports.createTask = async (req, res, next) => {
    try {
        const {
            title,
            description,
            status,
            priority,
            dueDate,
            category,
            tags,
            project,
            parent,
            assignees,
            estimatedTime
        } = req.body;

        // Check if project exists and user is a member
        if (project) {
            const projectDoc = await Project.findById(project);

            if (!projectDoc) {
                return next(new ApiError('Project not found', 404));
            }

            if (!projectDoc.isMember(req.user._id)) {
                return next(new ApiError('You are not a member of this project', 403));
            }
        }

        // Create task
        const task = await Task.create({
            title,
            description,
            status: status || 'todo',
            priority: priority || 'medium',
            dueDate,
            category,
            tags,
            project,
            parent,
            user: req.user._id,
            assignees: assignees || [{ user: req.user._id, role: 'responsible' }],
            estimatedTime
        });

        // Populate references for response
        await task.populate([
            { path: 'category', select: 'name color icon' },
            { path: 'tags', select: 'name color' },
            { path: 'project', select: 'name color icon' },
            { path: 'assignees.user', select: 'name avatar' }
        ]);

        res.status(201).json({
            success: true,
            data: task
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get a single task
 * @route   GET /api/tasks/:id
 * @access  Private
 */
exports.getTask = async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('category', 'name color icon')
            .populate('tags', 'name color')
            .populate('project', 'name color icon')
            .populate('assignees.user', 'name avatar email')
            .populate({
                path: 'parent',
                select: 'title status'
            });

        if (!task) {
            return next(new ApiError('Task not found', 404));
        }

        // Check if user is the task owner or an assignee
        const isOwnerOrAssignee =
            task.user.toString() === req.user._id.toString() ||
            task.assignees.some(assignee => assignee.user._id.toString() === req.user._id.toString());

        // If not owner or assignee, check if it's a project task and user is project member
        if (!isOwnerOrAssignee && task.project) {
            const project = await Project.findById(task.project);
            if (!project || !project.isMember(req.user._id)) {
                return next(new ApiError('Not authorized to access this task', 403));
            }
        } else if (!isOwnerOrAssignee) {
            return next(new ApiError('Not authorized to access this task', 403));
        }

        res.status(200).json({
            success: true,
            data: task
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update a task
 * @route   PUT /api/tasks/:id
 * @access  Private
 */
exports.updateTask = async (req, res, next) => {
    try {
        const {
            title,
            description,
            status,
            priority,
            dueDate,
            category,
            tags,
            project,
            parent,
            assignees,
            estimatedTime,
            actualTime
        } = req.body;

        let task = await Task.findById(req.params.id);

        if (!task) {
            return next(new ApiError('Task not found', 404));
        }

        // Check if user is authorized to update this task
        const isOwnerOrAssignee =
            task.user.toString() === req.user._id.toString() ||
            task.assignees.some(assignee =>
                assignee.user.toString() === req.user._id.toString() &&
                assignee.role === 'responsible'
            );

        // If not owner or responsible assignee, check if it's a project task and user is project manager
        let hasProjectManagerAccess = false;

        if (!isOwnerOrAssignee && task.project) {
            const project = await Project.findById(task.project);
            if (project && project.isManagerOrOwner(req.user._id)) {
                hasProjectManagerAccess = true;
            }
        }

        if (!isOwnerOrAssignee && !hasProjectManagerAccess) {
            return next(new ApiError('Not authorized to update this task', 403));
        }

        // Check if changing project and if user has access to the new project
        if (project && project !== task.project) {
            const projectDoc = await Project.findById(project);

            if (!projectDoc) {
                return next(new ApiError('Project not found', 404));
            }

            if (!projectDoc.isMember(req.user._id)) {
                return next(new ApiError('You are not a member of the selected project', 403));
            }
        }

        // Handle completion status
        let completedAt = task.completedAt;
        if (status === 'completed' && task.status !== 'completed') {
            completedAt = new Date();
        } else if (status !== 'completed' && task.status === 'completed') {
            completedAt = null;
        }

        // Update task
        task = await Task.findByIdAndUpdate(
            req.params.id,
            {
                title,
                description,
                status,
                priority,
                dueDate,
                category,
                tags,
                project,
                parent,
                assignees,
                estimatedTime,
                actualTime,
                completedAt
            },
            { new: true, runValidators: true }
        );

        // Populate references for response
        await task.populate([
            { path: 'category', select: 'name color icon' },
            { path: 'tags', select: 'name color' },
            { path: 'project', select: 'name color icon' },
            { path: 'assignees.user', select: 'name avatar' }
        ]);

        res.status(200).json({
            success: true,
            data: task
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete a task
 * @route   DELETE /api/tasks/:id
 * @access  Private
 */
exports.deleteTask = async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return next(new ApiError('Task not found', 404));
        }

        // Check if user is authorized to delete this task
        const isOwner = task.user.toString() === req.user._id.toString();

        // If not owner, check if it's a project task and user is project manager
        let hasProjectManagerAccess = false;

        if (!isOwner && task.project) {
            const project = await Project.findById(task.project);
            if (project && project.isManagerOrOwner(req.user._id)) {
                hasProjectManagerAccess = true;
            }
        }

        if (!isOwner && !hasProjectManagerAccess) {
            return next(new ApiError('Not authorized to delete this task', 403));
        }

        // Instead of deleting, mark as archived
        task.status = 'archived';
        await task.save();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Permanently delete a task
 * @route   DELETE /api/tasks/:id/force
 * @access  Private
 */
exports.forceDeleteTask = async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return next(new ApiError('Task not found', 404));
        }

        // Check if user is authorized to delete this task
        const isOwner = task.user.toString() === req.user._id.toString();

        // If not owner, check if it's a project task and user is project manager
        let hasProjectManagerAccess = false;

        if (!isOwner && task.project) {
            const project = await Project.findById(task.project);
            if (project && project.isManagerOrOwner(req.user._id)) {
                hasProjectManagerAccess = true;
            }
        }

        if (!isOwner && !hasProjectManagerAccess) {
            return next(new ApiError('Not authorized to delete this task', 403));
        }

        // Update all subtasks to remove parent reference
        await Task.updateMany(
            { parent: task._id },
            { $unset: { parent: "" } }
        );

        // Completely delete the task
        await task.remove();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update task tags
 * @route   PATCH /api/tasks/:id/tags
 * @access  Private
 */
exports.updateTaskTags = async (req, res, next) => {
    try {
        const { tags } = req.body;

        let task = await Task.findById(req.params.id);

        if (!task) {
            return next(new ApiError('Task not found', 404));
        }

        // Check if user is authorized to update this task
        const isOwnerOrAssignee =
            task.user.toString() === req.user._id.toString() ||
            task.assignees.some(assignee =>
                assignee.user.toString() === req.user._id.toString()
            );

        if (!isOwnerOrAssignee) {
            return next(new ApiError('Not authorized to update this task', 403));
        }

        // Update tags
        task = await Task.findByIdAndUpdate(
            req.params.id,
            { tags },
            { new: true, runValidators: true }
        ).populate('tags', 'name color');

        res.status(200).json({
            success: true,
            data: task
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Assign task to user
 * @route   POST /api/tasks/:id/assign
 * @access  Private
 */
exports.assignTask = async (req, res, next) => {
    try {
        const { userId, role } = req.body;

        let task = await Task.findById(req.params.id);

        if (!task) {
            return next(new ApiError('Task not found', 404));
        }

        // Check if user is authorized to assign this task
        const isOwner = task.user.toString() === req.user._id.toString();

        // If not owner, check if it's a project task and user is project manager
        let hasProjectManagerAccess = false;

        if (!isOwner && task.project) {
            const project = await Project.findById(task.project);
            if (project && project.isManagerOrOwner(req.user._id)) {
                hasProjectManagerAccess = true;
            }
        }

        if (!isOwner && !hasProjectManagerAccess) {
            return next(new ApiError('Not authorized to assign this task', 403));
        }

        // Check if user is already assigned
        const assigneeIndex = task.assignees.findIndex(
            assignee => assignee.user.toString() === userId
        );

        if (assigneeIndex !== -1) {
            // Update existing assignee's role
            task.assignees[assigneeIndex].role = role || 'responsible';
        } else {
            // Add new assignee
            task.assignees.push({
                user: userId,
                role: role || 'responsible'
            });
        }

        await task.save();

        // Populate for response
        await task.populate({
            path: 'assignees.user',
            select: 'name avatar email'
        });

        res.status(200).json({
            success: true,
            data: task
        });
    } catch (error) {
        next(error);
    }
};