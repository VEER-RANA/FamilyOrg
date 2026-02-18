const express = require('express');
const router = express.Router();
const Invitation = require('../models/Invitation');
const { notifyUser } = require('../services/notificationService');
const User = require('../models/User');
const Event = require('../models/Event');
const Trip = require('../models/Trip');
const auth = require('../middleware/auth');

const toTitleCase = (value = '') => String(value)
  .trim()
  .split(/[_\s-]+/)
  .filter(Boolean)
  .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
  .join(' ');

const getEventInviteLabel = (theme) => {
  const themeName = toTitleCase(theme);
  return themeName ? `${themeName} Invite` : 'Event Invite';
};

const getTripInviteLabel = (theme) => {
  const themeName = toTitleCase(theme);
  return themeName ? `${themeName} Invite` : 'Trip Invite';
};

const normalizeInvitationRole = (role) => (
  role === 'organizer' ? 'organizer' : 'participant'
);

// Send an invitation
router.post('/send', auth, async (req, res) => {
  try {
    const { memberId, eventId, tripId, role: requestedRole = 'participant', message } = req.body;
    const role = normalizeInvitationRole(requestedRole);
    
    if (!memberId || (!eventId && !tripId)) {
      return res.status(400).json({ message: 'Member and event or trip is required' });
    }

    // Find the user to invite
    const invitedUser = await User.findById(memberId);
    if (!invitedUser) {
      return res.status(404).json({ message: 'Member not found' });
    }

    // Can't invite yourself
    if (invitedUser._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot invite yourself' });
    }

    // Check if invitation already exists (pending, accepted, or declined)
    const existingInvitation = await Invitation.findOne({
      invitedUser: invitedUser._id,
      invitedBy: req.user.id,
      ...(eventId && { eventId }),
      ...(tripId && { tripId })
    });

    if (existingInvitation) {
      if (existingInvitation.status === 'pending') {
        return res.status(400).json({ message: 'Invitation already sent to this member' });
      }
      if (existingInvitation.status === 'accepted') {
        return res.status(400).json({ message: 'Member already accepted this invitation' });
      }
      // If declined, allow re-invitation
      if (existingInvitation.status === 'declined') {
        existingInvitation.status = 'pending';
        existingInvitation.respondedAt = null;
        await existingInvitation.save();
        
        // Create new notification for re-invitation
        const inviter = await User.findById(req.user.id);
        const eventOrTrip = eventId ? await Event.findById(eventId) : await Trip.findById(tripId);
        
        const notificationMessage = eventId 
          ? `${inviter.name} invited you to event "${eventOrTrip.title}"`
          : `${inviter.name} invited you to trip "${eventOrTrip.title}"`;

        const notificationTitle = eventId ? 'New Event Invitation' : 'New Trip Invitation';
        const actionUrl = '/dashboard';
        const inviteNote = message ? String(message).trim() : '';
        const emailTheme = eventId
          ? { type: 'event', theme: eventOrTrip?.theme, title: eventOrTrip?.title, label: getEventInviteLabel(eventOrTrip?.theme), note: inviteNote }
          : { type: 'trip', theme: eventOrTrip?.theme, title: eventOrTrip?.title, label: getTripInviteLabel(eventOrTrip?.theme), note: inviteNote };

        await notifyUser({
          userId: invitedUser._id,
          type: 'invitation',
          title: notificationTitle,
          message: notificationMessage,
          relatedId: existingInvitation._id,
          relatedModel: 'Invitation',
          actionUrl,
          priority: 'high',
          relatedUser: req.user.id,
          emailTheme
        });

        return res.json({ message: 'Invitation re-sent successfully', invitation: existingInvitation });
      }
    }

    // Create invitation
    const invitation = await Invitation.create({
      invitedBy: req.user.id,
      invitedUser: invitedUser._id,
      eventId: eventId || null,
      tripId: tripId || null,
      role,
      status: 'pending',
      message,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });

    // Add invited user to event/trip attendees if not already there
    if (eventId) {
      const event = await Event.findById(eventId);
      const isAlreadyInvited = event.attendees.some(a => a.userId.toString() === invitedUser._id.toString());
      if (!isAlreadyInvited) {
        event.attendees.push({
          userId: invitedUser._id,
          role,
          status: 'invited',
          joinedAt: new Date()
        });
        await event.save();
      }
    }

    if (tripId) {
      const trip = await Trip.findById(tripId);
      const isAlreadyInvited = trip.participants.some(p => p.userId.toString() === invitedUser._id.toString());
      if (!isAlreadyInvited) {
        trip.participants.push({
          userId: invitedUser._id,
          role,
          status: 'invited',
          joinedAt: new Date()
        });
        await trip.save();
      }
    }

    // Create notification for invited user
    const inviter = await User.findById(req.user.id);
    const eventOrTrip = eventId ? await Event.findById(eventId) : await Trip.findById(tripId);
    
    const notificationMessage = eventId 
      ? `${inviter.name} invited you to event "${eventOrTrip.title}"`
      : `${inviter.name} invited you to trip "${eventOrTrip.title}"`;

    const notificationTitle = eventId ? 'New Event Invitation' : 'New Trip Invitation';
    const actionUrl = '/dashboard';
    const inviteNote = message ? String(message).trim() : '';
    const emailTheme = eventId
      ? { type: 'event', theme: eventOrTrip?.theme, title: eventOrTrip?.title, label: getEventInviteLabel(eventOrTrip?.theme), note: inviteNote }
      : { type: 'trip', theme: eventOrTrip?.theme, title: eventOrTrip?.title, label: getTripInviteLabel(eventOrTrip?.theme), note: inviteNote };

    await notifyUser({
      userId: invitedUser._id,
      type: 'invitation',
      title: notificationTitle,
      message: notificationMessage,
      relatedId: invitation._id,
      relatedModel: 'Invitation',
      actionUrl,
      priority: 'high',
      relatedUser: req.user.id,
      emailTheme
    });

    res.json({ message: 'Invitation sent successfully', invitation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Error sending invitation' });
  }
});

// Get pending invitations for current user
router.get('/pending', auth, async (req, res) => {
  try {
    const invitations = await Invitation.find({ invitedUser: req.user.id, status: 'pending' })
      .populate('invitedBy', 'name email')
      .populate('eventId', 'title date')
      .populate('tripId', 'title startDate');

    res.json(invitations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching invitations' });
  }
});

// Accept invitation
router.post('/:invitationId/accept', auth, async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.invitationId);

    if (!invitation || invitation.invitedUser.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    invitation.status = 'accepted';
    invitation.respondedAt = new Date();
    await invitation.save();

    // Update user status in event or trip
    if (invitation.eventId) {
      await Event.findByIdAndUpdate(
        invitation.eventId,
        {
          $set: {
            'attendees.$[elem].status': 'accepted',
            'attendees.$[elem].joinedAt': new Date()
          }
        },
        {
          arrayFilters: [{ 'elem.userId': req.user.id }],
          upsert: false
        }
      );
      // If user wasn't in attendees, add them
      const event = await Event.findById(invitation.eventId);
      const attendeeExists = event.attendees.some(a => a.userId.toString() === req.user.id);
      if (!attendeeExists) {
        await Event.findByIdAndUpdate(
          invitation.eventId,
          {
            $push: {
              attendees: {
                userId: req.user.id,
                role: normalizeInvitationRole(invitation.role),
                status: 'accepted',
                joinedAt: new Date()
              }
            }
          }
        );
      }
    } else if (invitation.tripId) {
      await Trip.findByIdAndUpdate(
        invitation.tripId,
        {
          $set: {
            'participants.$[elem].status': 'accepted',
            'participants.$[elem].joinedAt': new Date()
          }
        },
        {
          arrayFilters: [{ 'elem.userId': req.user.id }],
          upsert: false
        }
      );
      // If user wasn't in participants, add them
      const trip = await Trip.findById(invitation.tripId);
      const participantExists = trip.participants.some(p => p.userId.toString() === req.user.id);
      if (!participantExists) {
        await Trip.findByIdAndUpdate(
          invitation.tripId,
          {
            $push: {
              participants: {
                userId: req.user.id,
                role: normalizeInvitationRole(invitation.role),
                status: 'accepted',
                joinedAt: new Date()
              }
            }
          }
        );
      }
    }

    // Create notification for inviter
    const user = await User.findById(req.user.id);
    const notificationMessage = `${user.name} accepted your invitation`;

    await notifyUser({
      userId: invitation.invitedBy,
      type: 'rsvp_response',
      title: 'Invitation Accepted',
      message: notificationMessage,
      relatedId: invitation._id,
      relatedModel: 'Invitation',
      relatedUser: req.user.id
    });

    res.json({ message: 'Invitation accepted', invitation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error accepting invitation' });
  }
});

// Get invitations for a specific event/trip (for organizers to see decline reasons)
router.get('/item/:itemType/:itemId', auth, async (req, res) => {
  try {
    const { itemType, itemId } = req.params;
    
    // Find the event or trip to verify user is organizer
    let item;
    if (itemType === 'event') {
      item = await Event.findById(itemId);
    } else if (itemType === 'trip') {
      item = await Trip.findById(itemId);
    } else {
      return res.status(400).json({ message: 'Invalid item type' });
    }

    if (!item) {
      return res.status(404).json({ message: `${itemType} not found` });
    }

    // Check if user is organizer
    const userRole = itemType === 'event' 
      ? item.attendees.find(a => a.userId.toString() === req.user.id)?.role
      : item.participants.find(p => p.userId.toString() === req.user.id)?.role;

    if (userRole !== 'organizer' && item.createdBy?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only organizers can view invitation details' });
    }

    // Get all invitations for this item
    const query = itemType === 'event' 
      ? { eventId: itemId }
      : { tripId: itemId };

    const invitations = await Invitation.find(query)
      .populate('invitedUser', 'name email')
      .populate('invitedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(invitations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching invitations' });
  }
});

// Decline invitation
router.post('/:invitationId/decline', auth, async (req, res) => {
  try {
    const { predefinedReason, customReason } = req.body;
    const invitation = await Invitation.findById(req.params.invitationId);

    if (!invitation || invitation.invitedUser.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    invitation.status = 'declined';
    invitation.respondedAt = new Date();
    
    // Store decline reason
    if (predefinedReason || customReason) {
      invitation.declineReason = {
        predefinedReason: predefinedReason || undefined,
        customReason: customReason || undefined
      };
    }
    
    await invitation.save();

    // Update user status in event or trip to declined
    if (invitation.eventId) {
      await Event.findByIdAndUpdate(
        invitation.eventId,
        {
          $set: {
            'attendees.$[elem].status': 'declined'
          }
        },
        {
          arrayFilters: [{ 'elem.userId': req.user.id }],
          upsert: false
        }
      );
    } else if (invitation.tripId) {
      await Trip.findByIdAndUpdate(
        invitation.tripId,
        {
          $set: {
            'participants.$[elem].status': 'declined'
          }
        },
        {
          arrayFilters: [{ 'elem.userId': req.user.id }],
          upsert: false
        }
      );
    }

    // Create notification for inviter
    const user = await User.findById(req.user.id);
    const itemType = invitation.eventId ? 'event' : 'trip';
    const eventOrTrip = invitation.eventId
      ? await Event.findById(invitation.eventId)
      : await Trip.findById(invitation.tripId);
    const itemTheme = eventOrTrip?.theme;
    const itemTitle = eventOrTrip?.title;
    const inviteLabel = itemType === 'event'
      ? getEventInviteLabel(itemTheme)
      : getTripInviteLabel(itemTheme);
    const declineNote = [predefinedReason, customReason].filter(Boolean).join(' - ');

    const notificationMessage = itemTitle
      ? `${user.name} declined your ${itemType} invitation for "${itemTitle}"`
      : `${user.name} declined your ${itemType} invitation`;

    await notifyUser({
      userId: invitation.invitedBy,
      type: 'rsvp_response',
      title: 'Invitation Declined',
      message: notificationMessage,
      relatedId: invitation._id,
      relatedModel: 'Invitation',
      relatedUser: req.user.id,
      emailTheme: {
        type: itemType,
        theme: itemTheme,
        title: itemTitle,
        label: `${inviteLabel} Declined`,
        note: declineNote
      }
    });

    res.json({ message: 'Invitation declined', invitation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error declining invitation' });
  }
});

module.exports = router;
