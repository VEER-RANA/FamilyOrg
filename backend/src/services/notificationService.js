const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendNotificationEmail } = require('./emailService');

const notifyUser = async ({
  userId,
  type,
  title,
  message,
  relatedId,
  relatedModel,
  relatedUser,
  actionUrl,
  priority,
  emailTheme
}) => {
  const notification = await Notification.create({
    userId,
    type,
    title,
    message,
    relatedId,
    relatedModel,
    relatedUser,
    actionUrl,
    priority
  });

  try {
    const user = await User.findById(userId).select('email name');
    if (user?.email) {
      const firstName = user.name ? user.name.split(' ')[0] : undefined;
      await sendNotificationEmail({
        to: user.email,
        subject: title,
        message,
        actionUrl,
        userName: firstName,
        emailTheme
      });
    }
  } catch (err) {
    console.error('Notification email failed:', err.message || err);
  }

  return notification;
};

module.exports = {
  notifyUser
};
