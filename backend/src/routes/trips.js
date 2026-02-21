const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Trip = require('../models/Trip');
const TripTask = require('../models/TripTask');
const TripExpense = require('../models/TripExpense');
const TripComment = require('../models/TripComment');
const TripPhoto = require('../models/TripPhoto');
const { notifyUser } = require('../services/notificationService');

// Create trip
router.post('/', auth, async (req, res) => {
  try {
    const { title, startDate, endDate, itinerary, places, googlePhotosAlbumUrl, theme } = req.body;
    if (!title || !startDate || !endDate) return res.status(400).json({ message: 'Title, start and end dates are required' });

    const trip = await Trip.create({ 
      title, 
      startDate: new Date(startDate), 
      endDate: new Date(endDate), 
      itinerary: itinerary || [],
      places: places || [],
      googlePhotosAlbumUrl,
      theme: theme || 'trip',
      createdBy: req.user.id,
      // Set creator as organizer
      participants: [{
        userId: req.user.id,
        role: 'organizer',
        status: 'accepted',
        joinedAt: new Date()
      }]
    });
    res.json(trip);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// List trips - only show trips where user is creator or has accepted
router.get('/', auth, async (req, res) => {
  try {
    // User can see trips if:
    // 1. They created it (createdBy)
    // 2. They are in participants array with status 'accepted'
    // 3. isPublic is true (optional public trips)
    const trips = await Trip.find({
      $or: [
        { createdBy: req.user.id },
        { 'participants': { $elemMatch: { userId: req.user.id, status: 'accepted' } } },
        { isPublic: true }
      ]
    })
      .populate('createdBy', 'name email')
      .populate('participants.userId', 'name email')
      .sort({ startDate: 1 })
      .lean();
    res.json(trips);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single trip by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('participants.userId', 'name email')
      .lean();
    
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Check if user has access to this trip
    const hasAccess = trip.createdBy._id.toString() === req.user.id ||
      trip.participants.some(p => p.userId._id.toString() === req.user.id) ||
      trip.isPublic;

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(trip);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update trip (for itinerary, etc.)
router.patch('/:id', auth, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id).populate('createdBy').populate('participants.userId');
    
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Only organizer or creator can update
    const isCreator = trip.createdBy._id.toString() === req.user.id;
    const isOrganizer = trip.participants.some(
      p => p.userId._id.toString() === req.user.id && p.role === 'organizer'
    );

    if (!isCreator && !isOrganizer) {
      return res.status(403).json({ message: 'Only organizers or creator can update the trip' });
    }

    // Update allowed fields
    if (req.body.itinerary !== undefined) trip.itinerary = req.body.itinerary;
    if (req.body.places !== undefined) trip.places = req.body.places;
    if (req.body.title) trip.title = req.body.title;
    if (req.body.description !== undefined) trip.description = req.body.description;
    if (req.body.googlePhotosAlbumUrl !== undefined) trip.googlePhotosAlbumUrl = req.body.googlePhotosAlbumUrl || undefined;
    if (req.body.startDate) trip.startDate = new Date(req.body.startDate);
    if (req.body.endDate) trip.endDate = new Date(req.body.endDate);
    if (req.body.theme) trip.theme = req.body.theme;
    if (req.body.budget !== undefined) trip.budget = req.body.budget;

    trip.updatedAt = new Date();
    await trip.save();
    
    const updatedTrip = await Trip.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('participants.userId', 'name email');
    
    res.json(updatedTrip);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== TASK ROUTES ====================

// Get all tasks for a trip
router.get('/:id/tasks', auth, async (req, res) => {
  try {
    const tasks = await TripTask.find({ tripId: req.params.id })
      .populate('createdBy', 'name') // email
      .populate('assignedTo', 'name') // email
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a task
router.post('/:id/tasks', auth, async (req, res) => {
  try {
    const { description, assignedTo, dueDate } = req.body;
    const task = await TripTask.create({
      tripId: req.params.id,
      description,
      createdBy: req.user.id,
      assignedTo,
      dueDate
    });
    const populatedTask = await TripTask.findById(task._id)
      .populate('createdBy', 'name') // email
      .populate('assignedTo', 'name'); // email
    res.json(populatedTask);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a task
router.patch('/:tripId/tasks/:taskId', auth, async (req, res) => {
  try {
    const { completed, description } = req.body;
    const updateData = {};
    if (completed !== undefined) {
      updateData.completed = completed;
      if (completed) updateData.completedAt = new Date();
    }
    if (description) updateData.description = description;
    
    const task = await TripTask.findByIdAndUpdate(
      req.params.taskId,
      updateData,
      { new: true }
    ).populate('createdBy', 'name').populate('assignedTo', 'name'); // email email
    
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a task
router.delete('/:tripId/tasks/:taskId', auth, async (req, res) => {
  try {
    await TripTask.findByIdAndDelete(req.params.taskId);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== EXPENSE ROUTES ====================

// Get all expenses for a trip
router.get('/:id/expenses', auth, async (req, res) => {
  try {
    const expenses = await TripExpense.find({ tripId: req.params.id })
      .populate('paidBy', 'name') // email
      .populate('splitAmong', 'name') // email
      .sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create an expense
router.post('/:id/expenses', auth, async (req, res) => {
  try {
    const { description, amount, category, date, splitAmong, paidBy } = req.body;
    const expense = await TripExpense.create({
      tripId: req.params.id,
      description,
      amount: parseFloat(amount),
      category,
      paidBy: paidBy || req.user.id,
      splitAmong,
      date: date || new Date()
    });
    const populatedExpense = await TripExpense.findById(expense._id)
      .populate('paidBy', 'name') // email
      .populate('splitAmong', 'name'); // email
    res.json(populatedExpense);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete an expense
router.delete('/:tripId/expenses/:expenseId', auth, async (req, res) => {
  try {
    await TripExpense.findByIdAndDelete(req.params.expenseId);
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== COMMENT ROUTES ====================

// Get all comments for a trip
router.get('/:id/comments', auth, async (req, res) => {
  try {
    const comments = await TripComment.find({ tripId: req.params.id })
      .populate('userId', 'name') // email
      .sort({ createdAt: 1 });
    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a comment
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { text } = req.body;
    const trip = await Trip.findById(req.params.id).populate('participants.userId', 'name email');
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const comment = await TripComment.create({
      tripId: req.params.id,
      userId: req.user.id,
      text
    });

    // Notify participants (accepted) excluding author
    const recipients = (trip.participants || []).filter(p => {
      const id = p.userId?._id?.toString() || p.userId?.toString();
      return p.status === 'accepted' && id && id !== req.user.id;
    });

    const preview = (text || '').slice(0, 120);
    const senderFirst = trip.participants
      .map(p => p.userId)
      .find(u => (u?._id?.toString() || u?.toString()) === req.user.id)?.name?.split(' ')?.[0] || 'Someone';

    await Promise.all(recipients.map(p => notifyUser({
      userId: p.userId._id || p.userId,
      type: 'trip_comment',
      title: `New comment in ${trip.title}`,
      message: `${senderFirst} commented: ${preview}`,
      relatedId: trip._id,
      relatedModel: 'Trip',
      relatedUser: req.user.id,
      actionUrl: `/trips/${trip._id}`,
      emailTheme: {
        type: 'trip',
        theme: trip.theme,
        title: trip.title,
        label: `New Comment`
      }
    })));

    const populatedComment = await TripComment.findById(comment._id)
      .populate('userId', 'name'); // email
    res.json(populatedComment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a comment
router.delete('/:tripId/comments/:commentId', auth, async (req, res) => {
  try {
    const comment = await TripComment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    // Check if user is the comment author or trip organizer
    const trip = await Trip.findById(req.params.tripId);
    const isCommentAuthor = comment.userId.toString() === req.user.id;
    const isOrganizer = trip?.participants?.some(p => 
      p.userId.toString() === req.user.id && p.role === 'organizer'
    );

    if (!isCommentAuthor && !isOrganizer) {
      return res.status(403).json({ message: 'Only the comment author or organizer can delete this comment' });
    }

    await TripComment.findByIdAndDelete(req.params.commentId);
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== PHOTO ROUTES ====================

// Get all photos for a trip
router.get('/:id/photos', auth, async (req, res) => {
  try {
    const photos = await TripPhoto.find({ tripId: req.params.id })
      .populate('userId', 'name') // email
      .sort({ createdAt: -1 });
    res.json(photos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a photo reference (URL + optional caption)
router.post('/:id/photos', auth, async (req, res) => {
  try {
    const { url, caption } = req.body;
    if (!url) return res.status(400).json({ message: 'Photo URL is required' });

    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const hasAccess =
      trip.createdBy.toString() === req.user.id ||
      (trip.participants || []).some(p => p.userId.toString() === req.user.id && p.status === 'accepted') ||
      trip.isPublic;

    if (!hasAccess) {
      return res.status(403).json({ message: 'Only trip members can add photos' });
    }

    const created = await TripPhoto.create({
      tripId: req.params.id,
      userId: req.user.id,
      url,
      caption
    });

    const populated = await TripPhoto.findById(created._id).populate('userId', 'name'); // email
    res.json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a photo
router.delete('/:tripId/photos/:photoId', auth, async (req, res) => {
  try {
    const photo = await TripPhoto.findById(req.params.photoId);
    if (!photo) return res.status(404).json({ message: 'Photo not found' });

    const trip = await Trip.findById(req.params.tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const isUploader = photo.userId.toString() === req.user.id;
    const isOrganizer =
      trip.createdBy.toString() === req.user.id ||
      (trip.participants || []).some(p => p.userId.toString() === req.user.id && p.role === 'organizer');

    if (!isUploader && !isOrganizer) {
      return res.status(403).json({ message: 'Only the uploader or an organizer can delete this photo' });
    }

    await TripPhoto.findByIdAndDelete(req.params.photoId);
    res.json({ message: 'Photo deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete trip (only organizers or admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const t = await Trip.findById(req.params.id);
    if (!t) return res.status(404).json({ message: 'Trip not found' });

    // Check if user is admin
    if (req.user.role === 'admin') {
      await t.deleteOne();
      return res.json({ message: 'Trip deleted' });
    }

    // Check if user is organizer in participants
    const isOrganizer = t.participants && t.participants.some(p => 
      p.userId.toString() === req.user.id && p.role === 'organizer'
    );

    if (isOrganizer) {
      await t.deleteOne();
      return res.json({ message: 'Trip deleted' });
    }

    // during development allow deletion for convenience if NODE_ENV !== 'production'
    if (process.env.NODE_ENV !== 'production') {
      await t.deleteOne();
      return res.json({ message: 'Trip deleted (dev mode)' });
    }

    return res.status(403).json({ message: 'Only organizers can delete trips' });
  } catch (err) {
    console.error('Delete trip error:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

module.exports = router;