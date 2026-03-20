const express = require('express');
const GeneralSettings = require('../models/GeneralSettings');
const { adminAuth } = require('../middleware/adminAuth');

const router = express.Router();
router.use(adminAuth);

// ══════════════════════════════════════════════════════════════
// GENERAL SETTINGS
// ══════════════════════════════════════════════════════════════

/**
 * GET /api/admin/settings/general
 * Fetch general settings (platformName, adminEmail, etc.)
 */
router.get('/general', async (req, res) => {
  try {
    const settings = await GeneralSettings.getSettings();
    res.json({
      platformName: settings.platformName,
      adminEmail: settings.adminEmail,
      contactEmail: settings.contactEmail,
      phoneNumber: settings.phoneNumber,
      timezone: settings.timezone,
      language: settings.language,
      address: settings.address,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * PUT /api/admin/settings/general
 * Update general settings
 */
router.put('/general', async (req, res) => {
  try {
    const allowed = ['platformName', 'adminEmail', 'contactEmail', 'phoneNumber', 'timezone', 'language', 'address'];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }

    const settings = await GeneralSettings.getSettings();
    Object.assign(settings, update);
    await settings.save();

    res.json({
      platformName: settings.platformName,
      adminEmail: settings.adminEmail,
      contactEmail: settings.contactEmail,
      phoneNumber: settings.phoneNumber,
      timezone: settings.timezone,
      language: settings.language,
      address: settings.address,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// EMAIL / SMTP SETTINGS
// ══════════════════════════════════════════════════════════════

/**
 * GET /api/admin/settings/email
 */
router.get('/email', async (req, res) => {
  try {
    const settings = await GeneralSettings.getSettings();
    res.json({
      smtpHost: settings.smtpHost,
      smtpPort: settings.smtpPort,
      smtpUsername: settings.smtpUsername,
      smtpPassword: settings.smtpPassword ? '••••••••' : '',
      senderName: settings.senderName,
      senderEmail: settings.senderEmail,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * PUT /api/admin/settings/email
 */
router.put('/email', async (req, res) => {
  try {
    const allowed = ['smtpHost', 'smtpPort', 'smtpUsername', 'smtpPassword', 'senderName', 'senderEmail'];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }

    const settings = await GeneralSettings.getSettings();
    Object.assign(settings, update);
    await settings.save();

    res.json({
      smtpHost: settings.smtpHost,
      smtpPort: settings.smtpPort,
      smtpUsername: settings.smtpUsername,
      smtpPassword: settings.smtpPassword ? '••••••••' : '',
      senderName: settings.senderName,
      senderEmail: settings.senderEmail,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * POST /api/admin/settings/email/test
 * Send a test email (placeholder — implement actual email sending as needed)
 */
router.post('/email/test', async (req, res) => {
  try {
    const settings = await GeneralSettings.getSettings();
    if (!settings.smtpHost || !settings.senderEmail) {
      return res.status(400).json({ message: 'SMTP settings must be configured before sending a test email' });
    }
    // TODO: Integrate actual email sending (nodemailer, etc.)
    res.json({ ok: true, message: 'Test email sent successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// NOTIFICATION SETTINGS
// ══════════════════════════════════════════════════════════════

/**
 * GET /api/admin/settings/notifications
 */
router.get('/notifications', async (req, res) => {
  try {
    const settings = await GeneralSettings.getSettings();
    res.json(settings.notifications || {});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * PUT /api/admin/settings/notifications
 */
router.put('/notifications', async (req, res) => {
  try {
    const allowed = ['newOrders', 'newUsers', 'reviews', 'dailySummary', 'weeklyAnalytics', 'maintenance'];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }

    const settings = await GeneralSettings.getSettings();
    settings.notifications = { ...settings.notifications.toObject?.() || settings.notifications, ...update };
    await settings.save();

    res.json(settings.notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// APPEARANCE SETTINGS
// ══════════════════════════════════════════════════════════════

/**
 * GET /api/admin/settings/appearance
 */
router.get('/appearance', async (req, res) => {
  try {
    const settings = await GeneralSettings.getSettings();
    res.json(settings.appearance || {});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * PUT /api/admin/settings/appearance
 */
router.put('/appearance', async (req, res) => {
  try {
    const allowed = ['primaryColor', 'secondaryColor', 'darkMode', 'logo', 'favicon'];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }

    const settings = await GeneralSettings.getSettings();
    settings.appearance = { ...settings.appearance.toObject?.() || settings.appearance, ...update };
    await settings.save();

    res.json(settings.appearance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// SECURITY SETTINGS
// ══════════════════════════════════════════════════════════════

/**
 * GET /api/admin/settings/security
 */
router.get('/security', async (req, res) => {
  try {
    const settings = await GeneralSettings.getSettings();
    res.json({
      twoFactorEnabled: settings.security?.twoFactorEnabled || false,
      sessionTimeout: settings.security?.sessionTimeout || '30',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * PUT /api/admin/settings/security/password
 * Change admin password
 */
router.put('/security/password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    // req.user is set by adminAuth middleware (without password)
    // Re-fetch with password to compare
    const User = require('../models/User');
    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ ok: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * PUT /api/admin/settings/security/2fa
 * Toggle two-factor authentication
 */
router.put('/security/2fa', async (req, res) => {
  try {
    const { enabled } = req.body || {};
    const settings = await GeneralSettings.getSettings();
    settings.security = {
      ...settings.security.toObject?.() || settings.security,
      twoFactorEnabled: !!enabled,
    };
    await settings.save();

    res.json({ twoFactorEnabled: settings.security.twoFactorEnabled });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/admin/settings/security/login-history
 * Returns recent login history (placeholder)
 */
router.get('/security/login-history', async (req, res) => {
  try {
    // TODO: Implement actual login history tracking
    res.json([]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
