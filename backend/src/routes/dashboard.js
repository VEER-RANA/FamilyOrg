const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Event = require('../models/Event');
const Trip = require('../models/Trip');
const Notification = require('../models/Notification');
const TripExpense = require('../models/TripExpense');
const TripPhoto = require('../models/TripPhoto');

// GET /api/dashboard/summary
router.get('/summary', auth, async (req, res) => {
  try {
    const now = new Date();

    // Visibility filter: user can see if they created it, are accepted attendee, or it's public
    const visibilityFilter = {
      $or: [
        { createdBy: req.user.id },
        { 'attendees': { $elemMatch: { userId: req.user.id, status: 'accepted' } } },
        { isPublic: true }
      ]
    };

    const tripVisibilityFilter = {
      $or: [
        { createdBy: req.user.id },
        { 'participants': { $elemMatch: { userId: req.user.id, status: 'accepted' } } },
        { isPublic: true }
      ]
    };

    // Events: classify present (within +/-12 hours), upcoming (> now)
    const twelveHours = 1000 * 60 * 60 * 12;
    const presentWindowStart = new Date(now.getTime() - twelveHours);
    const presentWindowEnd = new Date(now.getTime() + twelveHours);

    const presentEvents = await Event.find({ 
      date: { $gte: presentWindowStart, $lte: presentWindowEnd },
      ...visibilityFilter
    })
      .populate('createdBy', 'name email')
      .populate('attendees.userId', 'name email')
      .sort({ date: 1 })
      .limit(10)
      .select('title date location attendees createdBy theme')
      .lean();

    const upcomingEvents = await Event.find({ 
      date: { $gt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3) },
      ...visibilityFilter
    })
      .populate('createdBy', 'name email')
      .populate('attendees.userId', 'name email')
      .sort({ date: 1 })
      .limit(10)
      .select('title date location attendees createdBy theme')
      .lean();

    const pastEvents = await Event.find({
      date: { $lt: presentWindowStart },
      ...visibilityFilter
    })
      .populate('createdBy', 'name email')
      .populate('attendees.userId', 'name email')
      .sort({ date: -1 })
      .limit(10)
      .select('title date location googlePhotosAlbumUrl attendees createdBy theme')
      .lean();

    // Trips: present (ongoing) and upcoming
    const presentTrips = await Trip.find({ 
      startDate: { $lte: now }, 
      endDate: { $gte: now },
      ...tripVisibilityFilter
    })
      .populate('createdBy', 'name email')
      .populate('participants.userId', 'name email')
      .sort({ startDate: 1 })
      .limit(10)
      .lean();

    const upcomingTrips = await Trip.find({ 
      endDate: { $gt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3) },
      ...tripVisibilityFilter
    })
      .populate('createdBy', 'name email')
      .populate('participants.userId', 'name email')
      .sort({ startDate: 1 })
      .limit(10)
      .lean();

    const pastTrips = await Trip.find({
      endDate: { $lt: now },
      ...tripVisibilityFilter
    })
      .populate('createdBy', 'name email')
      .populate('participants.userId', 'name email')
      .sort({ endDate: -1 })
      .limit(10)
      .select('title startDate endDate places budget googlePhotosAlbumUrl createdBy participants theme')
      .lean();

    const pastTripIds = pastTrips.map(t => t._id);
    const [expenseTotals, photoCounts] = await Promise.all([
      TripExpense.aggregate([
        { $match: { tripId: { $in: pastTripIds } } },
        { $group: { _id: '$tripId', total: { $sum: '$amount' } } }
      ]),
      TripPhoto.aggregate([
        { $match: { tripId: { $in: pastTripIds } } },
        { $group: { _id: '$tripId', count: { $sum: 1 } } }
      ])
    ]);

    const expenseTotalsMap = new Map(expenseTotals.map(e => [String(e._id), e.total]));
    const photoCountsMap = new Map(photoCounts.map(p => [String(p._id), p.count]));

    const pastTripsWithSummary = pastTrips.map(t => ({
      ...t,
      expenseTotal: expenseTotalsMap.get(String(t._id)) || 0,
      photoCount: photoCountsMap.get(String(t._id)) || 0
    }));

    // Unread notifications for the current user
    const unreadNotifications = await Notification.countDocuments({ userId: req.user.id, isRead: false });
    
    // Count open tasks from trips (using TripTask model)
    const TripTask = require('../models/TripTask');
    const openTasks = await TripTask.countDocuments({ completed: false });
    
    // Active trips: fetch the actual data, not just count
    const activeTripsData = await Trip.find({ 
      endDate: { $gte: now },
      ...tripVisibilityFilter
    })
      .populate('createdBy', 'name email')
      .populate('participants.userId', 'name email')
      .sort({ startDate: 1 })
      .limit(10)
      .lean();

    // Recent created items - only items created by the user or they're invited to (last 3 days, not past)
    const threeDays = 1000 * 60 * 60 * 24 * 3;
    const recentWindowStart = new Date(now.getTime() - threeDays);

    const recentEvents = await Event.find({
      ...visibilityFilter,
      createdAt: { $gte: recentWindowStart },
      date: { $gte: now }
    })
      .populate('createdBy', 'name email')
      .populate('attendees.userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title createdAt date')
      .lean();
    const recentTrips = await Trip.find({
      ...tripVisibilityFilter,
      createdAt: { $gte: recentWindowStart },
      endDate: { $gte: now }
    })
      .populate('createdBy', 'name email')
      .populate('participants.userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title createdAt startDate endDate')
      .lean();

    const recentCreated = [];
    recentEvents.forEach(e => recentCreated.push({ type: 'event', title: e.title, date: e.createdAt, meta: e }));
    recentTrips.forEach(t => recentCreated.push({ type: 'trip', title: t.title, date: t.createdAt, meta: t }));
    recentCreated.sort((a,b) => b.date - a.date);

    res.json({
      counts: {
        upcomingEvents: upcomingEvents.length,
        openTasks,
        activeTrips: activeTripsData.length,
        unreadNotifications
      },
      presentEvents,
      upcomingEvents,
      pastEvents,
      presentTrips,
      upcomingTrips,
      pastTrips: pastTripsWithSummary,
      activeTrips: activeTripsData,
      recentCreated: recentCreated.slice(0,10)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
