const nodemailer = require('nodemailer');
const https = require('https');

// Check which email service is configured
const getEmailProvider = () => {
  const brevoKey = process.env.BREVO_API_KEY;
  const hasGmail = Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);

  const hasBrevo = brevoKey &&
                   brevoKey.trim() !== '' &&
                   !brevoKey.includes('your_') &&
                   brevoKey.length > 20;

  if (hasBrevo) {
    return 'brevo';
  }
  if (hasGmail) {
    return 'gmail';
  }

  console.warn('⚠️ No email provider configured. Set BREVO_API_KEY or GMAIL_USER/GMAIL_APP_PASSWORD in .env');
  return null;
};

const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const toTitleCase = (value = '') => String(value)
  .trim()
  .split(/[_\s-]+/)
  .filter(Boolean)
  .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
  .join(' ');

const buildActionUrl = (actionUrl) => {
  if (!actionUrl) return null;
  if (/^https?:\/\//i.test(actionUrl)) return actionUrl;
  const base = process.env.APP_URL || process.env.FRONTEND_URL || '';
  if (!base) return actionUrl;
  const trimmedBase = base.replace(/\/$/, '');
  const trimmedPath = actionUrl.startsWith('/') ? actionUrl : `/${actionUrl}`;
  return `${trimmedBase}${trimmedPath}`;
};

const getThemePalette = (emailTheme = {}) => {
  const eventPalette = {
    default: { accent: '#667eea', soft: '#eef2ff', badge: '#e0e7ff', icon: '📅', label: 'Event' },
    birthday: { accent: '#8b5cf6', soft: '#ede9fe', badge: '#ddd6fe', icon: '🎂', label: 'Birthday' },
    meeting: { accent: '#38bdf8', soft: '#e0f2fe', badge: '#bae6fd', icon: '📅', label: 'Meeting' },
    dinner: { accent: '#1e3a8a', soft: '#dbeafe', badge: '#bfdbfe', icon: '🍽️', label: 'Dinner' },
    celebration: { accent: '#14b8a6', soft: '#ccfbf1', badge: '#99f6e4', icon: '🎉', label: 'Celebration' },
    katha: { accent: '#f97316', soft: '#ffedd5', badge: '#fed7aa', icon: '📜', label: 'Katha' },
    poojan: { accent: '#eab308', soft: '#fef9c3', badge: '#fef08a', icon: '🪔', label: 'Poojan' }
  };

  const tripPalette = {
    default: { accent: '#0ea5e9', soft: '#e0f2fe', badge: '#bae6fd', icon: '🧳', label: 'Trip' },
    temple: { accent: '#d97706', soft: '#fed7aa', badge: '#fdba74', icon: '🛕', label: 'Temple' },
    trip: { accent: '#22c55e', soft: '#dcfce7', badge: '#bbf7d0', icon: '🧳', label: 'Trip' },
    tour: { accent: '#0ea5e9', soft: '#ecfeff', badge: '#cffafe', icon: '🚌', label: 'Tour', headerBackground: 'linear-gradient(135deg, #22c55e 0%, #0ea5e9 50%, #a855f7 100%)' }
  };

  const type = emailTheme?.type === 'trip' ? 'trip' : 'event';
  const key = String(emailTheme?.theme || '').toLowerCase();
  const paletteSet = type === 'trip' ? tripPalette : eventPalette;
  return paletteSet[key] || paletteSet.default;
};

const sendBrevoEmail = ({ to, subject, text, html }) => new Promise((resolve, reject) => {
  const fromEmail = process.env.BREVO_FROM_EMAIL || 'noreply@familyorg.com';
  const fromName = process.env.BREVO_FROM_NAME || 'FamilyOrg';
  const payload = JSON.stringify({
    sender: { email: fromEmail, name: fromName },
    to: [{ email: to }],
    subject,
    textContent: text,
    htmlContent: html
  });

  const request = https.request(
    {
      method: 'POST',
      hostname: 'api.brevo.com',
      path: '/v3/smtp/email',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'api-key': process.env.BREVO_API_KEY
      }
    },
    (response) => {
      let data = '';
      response.on('data', (chunk) => { data += chunk; });
      response.on('end', () => {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ messageId: parsed.messageId, accepted: [to], provider: 'brevo' });
          return;
        }
        reject(new Error(`Brevo API error: ${response.statusCode} ${data}`));
      });
    }
  );

  request.on('error', (err) => reject(err));
  request.write(payload);
  request.end();
});

const sendNotificationEmail = async ({ to, subject, message, actionUrl, userName, emailTheme }) => {
  const provider = getEmailProvider();

  if (!provider) {
    console.warn('No email provider configured (Brevo or Gmail); skipping email send.');
    return { skipped: true };
  }
  if (!to) return { skipped: true };

  const link = buildActionUrl(actionUrl);
  const palette = getThemePalette(emailTheme);
  const greeting = userName ? `Hi ${userName},` : 'Hi,';
  const itemTitle = emailTheme?.title ? escapeHtml(emailTheme.title) : null;
  const noteText = emailTheme?.note ? escapeHtml(emailTheme.note) : null;
  const badgeLabel = emailTheme?.label ? emailTheme.label : palette.label;
  const badgeText = escapeHtml(`${palette.icon} ${badgeLabel}`.trim());

  const text = `${greeting}\n\n${message}${link ? `\n\nOpen: ${link}` : ''}\n\n— FamilyOrg`;
  const html = `
    <div style="margin:0;padding:24px;background:${palette.soft};font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 24px rgba(15,23,42,0.08);">
        <div style="padding:24px 24px 22px;background:${palette.headerBackground || `linear-gradient(135deg, ${palette.accent}, #0f172a)`};color:#ffffff;">
          <div style="font-size:12px;letter-spacing:0.2em;text-transform:uppercase;opacity:0.8;">FamilyOrg</div>
          <div style="margin-top:10px;font-size:26px;font-weight:800;letter-spacing:-0.4px;text-shadow:0 2px 8px rgba(15,23,42,0.25);">
            ${escapeHtml(subject)}
          </div>
        </div>
        <div style="padding:24px;">
          <div style="display:inline-block;padding:6px 12px;border-radius:999px;background:${palette.badge};color:#0f172a;font-size:12px;font-weight:700;">
            ${badgeText}
          </div>
          ${itemTitle ? `<div style="margin-top:14px;font-size:20px;font-weight:800;letter-spacing:-0.2px;color:#0f172a;">${itemTitle}</div>` : ''}
          <p style="margin:16px 0 0;line-height:1.6;color:#334155;">${escapeHtml(greeting)}</p>
          <p style="margin:12px 0 0;line-height:1.6;color:#334155;">${escapeHtml(message)}</p>
          ${noteText ? `
            <div style="margin-top:16px;padding:12px 14px;border-radius:12px;background:#f1f5f9;color:#1e293b;">
              <div style="font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#64748b;">Personal note</div>
              <div style="margin-top:6px;line-height:1.6;">${noteText}</div>
            </div>
          ` : ''}
          ${link ? `
            <div style="margin-top:20px;">
              <a href="${escapeHtml(link)}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:${palette.accent};color:#ffffff;text-decoration:none;font-weight:700;">Open in FamilyOrg</a>
            </div>
          ` : ''}
        </div>
        <div style="padding:16px 24px;background:#f8fafc;color:#64748b;font-size:12px;">
          You received this because you have a FamilyOrg account.
        </div>
      </div>
    </div>
  `;

  try {
    if (provider === 'brevo') {
      const info = await sendBrevoEmail({ to, subject, text, html });
      return info;
    } else {
      // Use Gmail SMTP (works locally, blocked on Render)
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD
        }
      });
      
      const info = await transporter.sendMail({
        from: `"FamilyOrg" <${process.env.GMAIL_USER}>`,
        to,
        subject,
        text,
        html
      });
      return { messageId: info.messageId, accepted: info.accepted, provider: 'gmail' };
    }
  } catch (err) {
    console.error(`Email send failed (${provider}):`, err.message || err);
    return { error: err, provider };
  }
};

module.exports = {
  sendNotificationEmail
};
