// Theme configuration for Events and Trips
export const EVENT_THEMES = {
  birthday: {
    name: 'Birthday',
    icon: '🎂',
    color: '#8b5cf6',
    bannerImage: '/themes/birthday.png',
    bgColor: '#ede9fe',
    borderColor: '#8b5cf6',
    description: 'Birthday celebration'
  },
  meeting: {
    name: 'Meeting',
    icon: '📅',
    color: '#38bdf8',
    bannerImage: '/themes/meeting.png',
    bgColor: '#e0f2fe',
    borderColor: '#38bdf8',
    description: 'Business or family meeting'
  },
  dinner: {
    name: 'Dinner',
    icon: '🍽️',
    color: '#1e3a8a',
    bannerImage: '/themes/dinner.png',
    bgColor: '#dbeafe',
    borderColor: '#1e3a8a',
    description: 'Dinner gathering'
  },
  celebration: {
    name: 'Celebration',
    icon: '🎉',
    color: '#14b8a6',
    bannerImage: '/themes/celebration.png',
    bgColor: '#ccfbf1',
    borderColor: '#14b8a6',
    description: 'Celebration event'
  },
  katha: {
    name: 'Katha',
    icon: '📜',
    color: '#f97316',
    bannerImage: '/themes/katha.png',
    bgColor: '#ffedd5',
    borderColor: '#f97316',
    description: 'Katha gathering'
  },
  poojan: {
    name: 'Poojan',
    icon: '🪔',
    color: '#eab308',
    bannerImage: '/themes/poojan.png',
    bgColor: '#fef9c3',
    borderColor: '#eab308',
    description: 'Poojan ceremony'
  }
};

export const TRIP_THEMES = {
  temple: {
    name: 'Temple',
    icon: '🛕',
    color: '#d97706',
    bannerImage: '/themes/temple.png',
    bgColor: '#fed7aa',
    borderColor: '#d97706',
    description: 'Temple visit'
  },
  trip: {
    name: 'Trip',
    icon: '🧳',
    color: '#22c55e',
    bannerImage: '/themes/trip.png',
    bgColor: '#dcfce7',
    borderColor: '#22c55e',
    description: 'General trip'
  },
  tour: {
    name: 'Tour',
    icon: '🚌',
    color: '#0ea5e9',
    gradient: 'linear-gradient(135deg, #22c55e 0%, #0ea5e9 50%, #a855f7 100%)',
    bannerImage: '/themes/tour.png',
    bgColor: '#ecfeff',
    borderColor: '#0ea5e9',
    description: 'Tour outing'
  }
};

export const getEventTheme = (theme) => EVENT_THEMES[theme] || EVENT_THEMES.meeting;
export const getTripTheme = (theme) => TRIP_THEMES[theme] || TRIP_THEMES.trip;

export const getThemeIcon = (type, theme) => {
  if (type === 'event') {
    return EVENT_THEMES[theme]?.icon || '📅';
  }
  return TRIP_THEMES[theme]?.icon || '🧳';
};

export const getThemeColor = (type, theme) => {
  if (type === 'event') {
    return EVENT_THEMES[theme]?.color || EVENT_THEMES.meeting.color;
  }
  return TRIP_THEMES[theme]?.color || TRIP_THEMES.trip.color;
};
