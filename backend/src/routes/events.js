const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Event = require('../models/Event');
const EventComment = require('../models/EventComment');
const { notifyUser } = require('../services/notificationService');

// Create event
router.post('/', auth, async (req, res) => {
  try {
    const { title, datetime, location, description, googlePhotosAlbumUrl, theme } = req.body;
    if (!title || !datetime) return res.status(400).json({ message: 'Title and datetime required' });

    const date = new Date(datetime);
    const event = await Event.create({ 
      title, 
      date, 
      location, 
      description,
      googlePhotosAlbumUrl,
      theme: theme || 'meeting',
      createdBy: req.user.id,
      // Set creator as organizer
      attendees: [{
        userId: req.user.id,
        role: 'organizer',
        status: 'accepted',
        joinedAt: new Date()
      }]
    });
    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// List events - only show events where user is creator or has accepted
router.get('/', auth, async (req, res) => {
  try {
    // User can see events if:
    // 1. They created it (createdBy)
    // 2. They are in attendees array with status 'accepted'
    // 3. isPublic is true (optional public events)
    const events = await Event.find({
      $or: [
        { createdBy: req.user.id },
        { 'attendees': { $elemMatch: { userId: req.user.id, status: 'accepted' } } },
        { isPublic: true }
      ]
    })
      .populate('createdBy', 'name email')
      .populate('attendees.userId', 'name email')
      .sort({ date: 1 })
      .lean();
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single event details
router.get('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('attendees.userId', 'name email');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is allowed to view this event
    const hasAccess = 
      event.createdBy._id.toString() === req.user.id ||
      event.attendees.some(a => a.userId._id.toString() === req.user.id) ||
      event.isPublic ||
      req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update event (only organizers)
router.patch('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('createdBy').populate('attendees.userId');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Only organizer or creator can update
    const isCreator = event.createdBy._id.toString() === req.user.id;
    const isOrganizer = event.attendees.some(
      a => a.userId._id.toString() === req.user.id && a.role === 'organizer'
    );

    if (!isCreator && !isOrganizer) {
      return res.status(403).json({ message: 'Only organizers or creator can update the event' });
    }

    // Update allowed fields
    if (req.body.title) event.title = req.body.title;
    if (req.body.location !== undefined) event.location = req.body.location;
    if (req.body.description !== undefined) event.description = req.body.description;
    if (req.body.datetime) event.date = new Date(req.body.datetime);
    if (req.body.theme) event.theme = req.body.theme;
    if (req.body.googlePhotosAlbumUrl !== undefined) {
      event.googlePhotosAlbumUrl = req.body.googlePhotosAlbumUrl || undefined;
    }

    event.updatedAt = new Date();
    await event.save();
    
    const updatedEvent = await Event.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('attendees.userId', 'name email');
    
    res.json(updatedEvent);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete event (only organizers or admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const ev = await Event.findById(req.params.id);
    if (!ev) return res.status(404).json({ message: 'Event not found' });

    // Check if user is admin
    if (req.user.role === 'admin') {
      await ev.deleteOne();
      return res.json({ message: 'Event deleted' });
    }

    // Check if user is organizer in attendees
    const isOrganizer = ev.attendees && ev.attendees.some(a => 
      a.userId.toString() === req.user.id && a.role === 'organizer'
    );

    if (isOrganizer) {
      await ev.deleteOne();
      return res.json({ message: 'Event deleted' });
    }

    // during development allow deletion for convenience if NODE_ENV !== 'production'
    if (process.env.NODE_ENV !== 'production') {
      await ev.deleteOne();
      return res.json({ message: 'Event deleted (dev mode)' });
    }

    return res.status(403).json({ message: 'Only organizers can delete events' });
  } catch (err) {
    console.error('Delete event error:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// ==================== COMMENT ROUTES ====================

// Get all comments for an event
router.get('/:id/comments', auth, async (req, res) => {
  try {
    const comments = await EventComment.find({ eventId: req.params.id })
      .populate('userId', 'name email')
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
    const event = await Event.findById(req.params.id).populate('attendees.userId', 'name email');
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const comment = await EventComment.create({
      eventId: req.params.id,
      userId: req.user.id,
      text
    });

    // Notify attendees (accepted) excluding author
    const recipients = (event.attendees || []).filter(a => {
      const id = a.userId?._id?.toString() || a.userId?.toString();
      return a.status === 'accepted' && id && id !== req.user.id;
    });

    const preview = (text || '').slice(0, 120);
    const commenterFirst = (event.attendees || [])
      .map(a => a.userId)
      .concat({ _id: req.user.id, name: req.user.name })
      .find(u => (u?._id?.toString() || u?.toString()) === req.user.id)?.name?.split(' ')?.[0] || 'Someone';

    await Promise.all(recipients.map(a => notifyUser({
      userId: a.userId._id || a.userId,
      type: 'event_comment',
      title: `New comment in ${event.title}`,
      message: `${commenterFirst} commented: ${preview}`,
      relatedId: event._id,
      relatedModel: 'Event',
      relatedUser: req.user.id,
      actionUrl: `/events/${event._id}`
    })));

    const populatedComment = await EventComment.findById(comment._id)
      .populate('userId', 'name email');
    res.json(populatedComment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a comment
router.delete('/:eventId/comments/:commentId', auth, async (req, res) => {
  try {
    const comment = await EventComment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Check if user is the comment author or event organizer
    const isCommentAuthor = comment.userId.toString() === req.user.id;
    const isOrganizer = event?.attendees?.some(a => 
      a.userId.toString() === req.user.id && a.role === 'organizer'
    );

    if (!isCommentAuthor && !isOrganizer) {
      return res.status(403).json({ message: 'Only the comment author or organizer can delete this comment' });
    }

    await EventComment.findByIdAndDelete(req.params.commentId);
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;