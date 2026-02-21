const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const invitationRoutes = require('./routes/invitations');
const notificationRoutes = require('./routes/notifications');
const userRoutes = require('./routes/users');
const Trip = require('./models/Trip');
const Notification = require('./models/Notification');
const { notifyUser } = require('./services/notificationService');

// Basic env validation to avoid confusing startup errors
const requiredEnv = ['MONGO_URI', 'JWT_SECRET'];
const missing = requiredEnv.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`Missing required env vars: ${missing.join(', ')}. Copy .env.example to .env and fill values.`);
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('FamilyOrg API is running'));
app.get('/health', (req, res) => res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() }));
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/events', require('./routes/events'));
app.use('/api/trips', require('./routes/trips'));
app.use('/api/invitations', invitationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);


const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    app.listen(PORT,'0.0.0.0', () => console.log(`Server running on port ${PORT}`));

    // Simple interval to send trip reminders ~24h before start
    const sendTripReminders = async () => {
      try {
        const now = new Date();
        const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const upcomingTrips = await Trip.find({
          startDate: { $gte: now, $lte: in24h }
        }).populate('participants.userId', 'name email');

        for (const trip of upcomingTrips) {
          const participants = (trip.participants || []).filter(p => p.status === 'accepted' && p.userId);

          for (const participant of participants) {
            const userId = participant.userId._id || participant.userId;
            const alreadySent = await Notification.exists({
              userId,
              relatedId: trip._id,
              type: 'trip_reminder'
            });
            if (alreadySent) continue;

            await notifyUser({
              userId,
              type: 'trip_reminder',
              title: `Trip starts soon: ${trip.title}`,
              message: `Your trip starts on ${new Date(trip.startDate).toLocaleDateString('en-GB')}. Pack your bags!`,
              relatedId: trip._id,
              relatedModel: 'Trip',
              actionUrl: `/trips/${trip._id}`,
              priority: 'high',
              emailTheme: {
                type: 'trip',
                theme: trip.theme,
                title: trip.title,
                label: 'Trip Reminder',
                note: `Starts ${new Date(trip.startDate).toLocaleDateString('en-GB')}`
              }
            });
          }
        }
      } catch (err) {
        console.error('Trip reminder job failed', err.message || err);
      }
    };

    // Run every hour and once on startup
    sendTripReminders();
    setInterval(sendTripReminders, 60 * 60 * 1000);
  })
  .catch(err => {
    console.error('Mongo connection error:', err);
    process.exit(1);
  });
