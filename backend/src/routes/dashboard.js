const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Event = require('../models/Event');
const Trip = require('../models/Trip');
const User = require('../models/User');
const Notification = require('../models/Notification');
const TripExpense = require('../models/TripExpense');
const EventComment = require('../models/EventComment');
const TripComment = require('../models/TripComment');
const TripPhoto = require('../models/TripPhoto');
const TripTask = require('../models/TripTask');
const Invitation = require('../models/Invitation');

let lastArchiveRunAt = 0;
const ARCHIVE_RUN_INTERVAL_MS = 1000 * 60 * 15;
const SUMMARY_CACHE_TTL_MS = 1000 * 30;
const summaryCache = new Map();

const archiveAndDeleteExpiredItems = async (pastRetentionCutoff) => {
  const expiredEvents = await Event.find({ date: { $lt: pastRetentionCutoff } })
    .select('_id title date location attendees createdBy')
    .lean();

  const expiredTrips = await Trip.find({ endDate: { $lt: pastRetentionCutoff } })
    .select('_id title startDate endDate places participants createdBy')
    .lean();

  const userUpdateOps = [];

  expiredEvents.forEach((event) => {
    const attendeeIds = new Set(
      (event.attendees || [])
        .filter(a => a.status === 'accepted' && a.userId)
        .map(a => String(a.userId))
    );
    if (event.createdBy) attendeeIds.add(String(event.createdBy));

    attendeeIds.forEach((attendeeId) => {
      userUpdateOps.push({
        updateOne: {
          filter: { _id: attendeeId },
          update: {
            $addToSet: {
              'attendedArchive.events': {
                eventId: event._id,
                title: event.title,
                date: event.date,
                place: event.location || ''
              }
            }
          }
        }
      });
    });
  });

  expiredTrips.forEach((trip) => {
    const participantIds = new Set(
      (trip.participants || [])
        .filter(p => p.status === 'accepted' && p.userId)
        .map(p => String(p.userId))
    );
    if (trip.createdBy) participantIds.add(String(trip.createdBy));

    const place = Array.isArray(trip.places) && trip.places.length ? trip.places.join(', ') : '';
    participantIds.forEach((participantId) => {
      userUpdateOps.push({
        updateOne: {
          filter: { _id: participantId },
          update: {
            $addToSet: {
              'attendedArchive.trips': {
                tripId: trip._id,
                title: trip.title,
                startDate: trip.startDate,
                endDate: trip.endDate,
                place
              }
            }
          }
        }
      });
    });
  });

  if (userUpdateOps.length) {
    await User.bulkWrite(userUpdateOps);
  }

  const eventIds = expiredEvents.map(e => e._id);
  const tripIds = expiredTrips.map(t => t._id);

  const deleteOps = [];
  if (eventIds.length) {
    deleteOps.push(EventComment.deleteMany({ eventId: { $in: eventIds } }));
    deleteOps.push(Invitation.deleteMany({ eventId: { $in: eventIds } }));
    deleteOps.push(Event.deleteMany({ _id: { $in: eventIds } }));
  }

  if (tripIds.length) {
    deleteOps.push(TripExpense.deleteMany({ tripId: { $in: tripIds } }));
    deleteOps.push(TripComment.deleteMany({ tripId: { $in: tripIds } }));
    deleteOps.push(TripPhoto.deleteMany({ tripId: { $in: tripIds } }));
    deleteOps.push(TripTask.deleteMany({ tripId: { $in: tripIds } }));
    deleteOps.push(Invitation.deleteMany({ tripId: { $in: tripIds } }));
    deleteOps.push(Trip.deleteMany({ _id: { $in: tripIds } }));
  }

  if (deleteOps.length) {
    await Promise.all(deleteOps);
  }
};

// GET /api/dashboard/summary
router.get('/summary', auth, async (req, res) => {
  try {
    const now = new Date();
    const nowMs = now.getTime();
    const userId = String(req.user.id);
    const forceRefresh = req.query.force === '1' || req.query.force === 'true';

    if (!forceRefresh) {
      const cachedEntry = summaryCache.get(userId);
      if (cachedEntry && (nowMs - cachedEntry.cachedAt) < SUMMARY_CACHE_TTL_MS) {
        return res.json(cachedEntry.data);
      }
    }

    const tenDaysMs = 1000 * 60 * 60 * 24 * 10;
    const pastRetentionCutoff = new Date(now.getTime() - tenDaysMs);

    if (nowMs - lastArchiveRunAt >= ARCHIVE_RUN_INTERVAL_MS) {
      await archiveAndDeleteExpiredItems(pastRetentionCutoff);
      lastArchiveRunAt = nowMs;
    }

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

    // Events remain active/upcoming until their date-time has passed
    // Recent created items - only items created by the user or they're invited to (last 3 days, not past)
    const threeDays = 1000 * 60 * 60 * 24 * 3;
    const recentWindowStart = new Date(now.getTime() - threeDays);

    const [
      upcomingEvents,
      pastEvents,
      pastTrips,
      unreadNotifications,
      activeTripsData,
      recentEvents,
      recentTrips
    ] = await Promise.all([
      Event.find({ 
        date: { $gte: now },
        ...visibilityFilter
      })
        .sort({ date: 1 })
        .limit(10)
        .select('title date location attendees theme')
        .lean(),
      Event.find({
        date: { $lt: now, $gte: pastRetentionCutoff },
        ...visibilityFilter
      })
        .sort({ date: -1 })
        .limit(10)
        .select('title date location googlePhotosAlbumUrl attendees theme')
        .lean(),
      Trip.find({
        endDate: { $lt: now, $gte: pastRetentionCutoff },
        ...tripVisibilityFilter
      })
        .sort({ endDate: -1 })
        .limit(10)
        .select('title startDate endDate places budget googlePhotosAlbumUrl participants theme')
        .lean(),
      Notification.countDocuments({ userId: req.user.id, isRead: false }),
      Trip.find({ 
        endDate: { $gte: now },
        ...tripVisibilityFilter
      })
        .sort({ startDate: 1 })
        .limit(10)
        .select('title startDate endDate participants theme')
        .lean(),
      Event.find({
        ...visibilityFilter,
        createdAt: { $gte: recentWindowStart },
        date: { $gte: now }
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title createdAt date')
        .lean(),
      Trip.find({
        ...tripVisibilityFilter,
        createdAt: { $gte: recentWindowStart },
        endDate: { $gte: now }
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title createdAt startDate endDate')
        .lean()
    ]);

    const pastTripIds = pastTrips.map(t => t._id);
    const expenseTotals = pastTripIds.length
      ? await TripExpense.aggregate([
        { $match: { tripId: { $in: pastTripIds } } },
        { $group: { _id: '$tripId', total: { $sum: '$amount' } } }
      ])
      : [];

    const expenseTotalsMap = new Map(expenseTotals.map(e => [String(e._id), e.total]));

    const pastTripsWithSummary = pastTrips.map(t => ({
      ...t,
      expenseTotal: expenseTotalsMap.get(String(t._id)) || 0
    }));

    const recentCreated = [];
    recentEvents.forEach(e => recentCreated.push({ type: 'event', title: e.title, date: e.createdAt, meta: e }));
    recentTrips.forEach(t => recentCreated.push({ type: 'trip', title: t.title, date: t.createdAt, meta: t }));
    recentCreated.sort((a,b) => b.date - a.date);

    const summaryPayload = {
      counts: {
        upcomingEvents: upcomingEvents.length,
        activeTrips: activeTripsData.length,
        unreadNotifications
      },
      upcomingEvents,
      pastEvents,
      pastTrips: pastTripsWithSummary,
      activeTrips: activeTripsData,
      recentCreated: recentCreated.slice(0,10)
    };

    summaryCache.set(userId, {
      data: summaryPayload,
      cachedAt: nowMs
    });

    if (summaryCache.size > 200) {
      const cutoff = nowMs - SUMMARY_CACHE_TTL_MS;
      for (const [cacheUserId, entry] of summaryCache.entries()) {
        if (entry.cachedAt < cutoff) {
          summaryCache.delete(cacheUserId);
        }
      }
    }

    res.json(summaryPayload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
