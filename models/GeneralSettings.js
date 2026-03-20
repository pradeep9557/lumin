const mongoose = require('mongoose');

const generalSettingsSchema = new mongoose.Schema({
  // General
  platformName: { type: String, default: 'Lumin Guide' },
  adminEmail: { type: String, default: '' },
  contactEmail: { type: String, default: '' },
  phoneNumber: { type: String, default: '' },
  timezone: { type: String, default: 'UTC' },
  language: { type: String, default: 'en' },
  address: { type: String, default: '' },

  // Email / SMTP
  smtpHost: { type: String, default: '' },
  smtpPort: { type: String, default: '587' },
  smtpUsername: { type: String, default: '' },
  smtpPassword: { type: String, default: '' },
  senderName: { type: String, default: '' },
  senderEmail: { type: String, default: '' },

  // Notifications
  notifications: {
    newOrders: { type: Boolean, default: false },
    newUsers: { type: Boolean, default: false },
    reviews: { type: Boolean, default: false },
    dailySummary: { type: Boolean, default: false },
    weeklyAnalytics: { type: Boolean, default: false },
    maintenance: { type: Boolean, default: false },
  },

  // Appearance
  appearance: {
    primaryColor: { type: String, default: '#0048ff' },
    secondaryColor: { type: String, default: '#090838' },
    darkMode: { type: Boolean, default: false },
    logo: { type: String, default: '' },
    favicon: { type: String, default: '' },
  },

  // Security
  security: {
    twoFactorEnabled: { type: Boolean, default: false },
    sessionTimeout: { type: String, default: '30' },
  },
}, { timestamps: true });

// Singleton pattern — only one settings doc in the collection
generalSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('GeneralSettings', generalSettingsSchema);
