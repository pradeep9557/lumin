/**
 * Lumin Guide — Database Seed Script
 *
 * Usage:
 *   node seed.js              → seeds all collections
 *   node seed.js --fresh      → drops existing data first, then seeds
 *   node seed.js --collection users   → seeds only the users collection
 *
 * Requires MONGODB_URI in .env (falls back to localhost).
 * Creates one admin user (admin@lumin.app / Admin@123) and sample users.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ── Models ──────────────────────────────────────────────
const User = require('./models/User');
const BirthChart = require('./models/BirthChart');
const Faq = require('./models/Faq');
const JournalEntry = require('./models/JournalEntry');
const PageContent = require('./models/PageContent');
const Post = require('./models/Post');
const SpiritualElement = require('./models/SpiritualElement');

// ── CLI flags ───────────────────────────────────────────
const args = process.argv.slice(2);
const FRESH = args.includes('--fresh');
const colIdx = args.indexOf('--collection');
const ONLY = colIdx !== -1 ? args[colIdx + 1] : null;

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lumin-guide';

// ════════════════════════════════════════════════════════
//  SEED DATA
// ════════════════════════════════════════════════════════

// ── Users ───────────────────────────────────────────────
const usersData = [
  {
    fullName: 'Admin User',
    email: 'admin@lumin.app',
    password: 'Admin@123',
    phone: '+1-555-000-0001',
    birthDate: '1990-06-15',
    birthTime: '08:30',
    birthPlace: 'New York',
    birthCountry: 'US',
    sunSign: 'Gemini',
    moonSign: 'Pisces',
    risingSign: 'Leo',
    role: 'admin',
    isActive: true,
  },
  {
    fullName: 'Aria Moonstone',
    email: 'aria@example.com',
    password: 'User@123',
    phone: '+1-555-100-0001',
    birthDate: '1995-03-21',
    birthTime: '14:00',
    birthPlace: 'Los Angeles',
    birthCountry: 'US',
    sunSign: 'Aries',
    moonSign: 'Cancer',
    risingSign: 'Scorpio',
    role: 'user',
    isActive: true,
  },
  {
    fullName: 'Leo Stardust',
    email: 'leo@example.com',
    password: 'User@123',
    phone: '+1-555-100-0002',
    birthDate: '1992-07-28',
    birthTime: '22:15',
    birthPlace: 'Chicago',
    birthCountry: 'US',
    sunSign: 'Leo',
    moonSign: 'Aquarius',
    risingSign: 'Taurus',
    role: 'user',
    isActive: true,
  },
  {
    fullName: 'Luna Celestia',
    email: 'luna@example.com',
    password: 'User@123',
    phone: '+1-555-100-0003',
    birthDate: '1998-12-05',
    birthTime: '03:45',
    birthPlace: 'Miami',
    birthCountry: 'US',
    sunSign: 'Sagittarius',
    moonSign: 'Virgo',
    risingSign: 'Capricorn',
    role: 'user',
    isActive: true,
  },
  {
    fullName: 'Nova Eclipse',
    email: 'nova@example.com',
    password: 'User@123',
    phone: '+1-555-100-0004',
    birthDate: '2000-09-10',
    birthTime: '11:00',
    birthPlace: 'Seattle',
    birthCountry: 'US',
    sunSign: 'Virgo',
    moonSign: 'Gemini',
    risingSign: 'Libra',
    role: 'user',
    isActive: true,
  },
  {
    fullName: 'Orion Blaze',
    email: 'orion@example.com',
    password: 'User@123',
    phone: '+1-555-100-0005',
    birthDate: '1988-01-20',
    birthTime: '06:00',
    birthPlace: 'Denver',
    birthCountry: 'US',
    sunSign: 'Aquarius',
    moonSign: 'Aries',
    risingSign: 'Sagittarius',
    role: 'user',
    isActive: false, // disabled user example
  },
];

// ── FAQs ────────────────────────────────────────────────
const faqsData = [
  { question: 'What is a birth chart?', answer: 'A birth chart (natal chart) is a map of where all the planets were at the exact moment you were born. It reveals your personality traits, strengths, challenges, and life purpose based on the positions of celestial bodies across the 12 zodiac signs and houses.', order: 1 },
  { question: 'How accurate are the horoscope readings?', answer: 'Our horoscope readings are generated using established astrological principles combined with real-time planetary positions. While astrology is a belief system and not a science, many users find our readings remarkably insightful and relevant to their daily experiences.', order: 2 },
  { question: 'What are the Big Three in astrology?', answer: 'The Big Three refers to your Sun sign, Moon sign, and Rising (Ascendant) sign. Your Sun sign represents your core identity, your Moon sign reflects your emotional inner world, and your Rising sign shows how others perceive you and your outward personality.', order: 3 },
  { question: 'How do I find my birth time for an accurate chart?', answer: 'The most reliable source is your official birth certificate, which often lists the exact time of birth. You can also check hospital records or ask family members who were present. If you cannot find your exact birth time, we can still generate a partial chart based on your date and location.', order: 4 },
  { question: 'What is compatibility matching?', answer: 'Our compatibility feature analyzes the astrological charts of two people to determine how well their energies align. We examine aspects between planets, element compatibility (fire, earth, air, water), and house overlaps to give you a comprehensive compatibility score and insights.', order: 5 },
  { question: 'How do crystals and herbs relate to astrology?', answer: 'Each zodiac sign and planet is associated with specific crystals and herbs that resonate with its energy. For example, amethyst is linked to Pisces for its intuitive properties, while rosemary is connected to the Sun for vitality. Using these elements can enhance your astrological practices and personal well-being.', order: 6 },
  { question: 'Can I use the app without knowing my birth time?', answer: 'Yes! While knowing your exact birth time provides the most accurate readings (especially for your Rising sign and house placements), you can still enjoy daily horoscopes, compatibility checks, community features, and spiritual element guides without it.', order: 7 },
  { question: 'How often are horoscopes updated?', answer: 'Daily horoscopes are refreshed every day based on current planetary transits. We also provide weekly and monthly overviews. Our AI-powered cosmic insights update in real-time to reflect significant astrological events like retrogrades, eclipses, and new/full moons.', order: 8 },
];

// ── Page Content ────────────────────────────────────────
const pagesData = [
  {
    slug: 'help_support',
    title: 'Help & Support',
    content: `Welcome to Lumin Guide Support! We're here to help you navigate your cosmic journey.

Getting Started:
To get the most accurate readings, make sure to complete your profile with your birth date, time, and place. This information allows us to generate your personal birth chart and tailored horoscopes.

Account Issues:
If you're having trouble logging in, try resetting your password through the "Forgot Password" link on the login screen. If the issue persists, ensure your email address is entered correctly.

Birth Chart Questions:
Your birth chart is generated automatically once you provide your birth details. If your chart seems incorrect, double-check that your birth time and location are accurate. Even a few minutes difference can affect house placements.

Contact Us:
For any issues not covered here, reach out to our support team at support@luminapp.com. We typically respond within 24 hours.

Community Guidelines:
Our community space is a safe and supportive environment. Please be respectful of others' beliefs and experiences. Any harassment or spam will result in account suspension.`,
  },
  {
    slug: 'privacy_policy',
    title: 'Privacy Policy',
    content: `Last updated: March 2026

Lumin Guide ("we", "us", "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your personal information when you use our mobile application and services.

Information We Collect:
We collect information you provide directly, including your name, email address, birth date, birth time, and birth location. This information is essential for generating accurate astrological readings and birth charts.

How We Use Your Information:
Your personal information is used to generate personalized horoscopes, birth charts, compatibility readings, and spiritual recommendations. We do not sell your personal data to third parties.

Data Security:
We implement industry-standard security measures to protect your data, including encryption in transit and at rest. Your password is hashed and never stored in plain text.

Data Retention:
We retain your account data for as long as your account is active. You may request deletion of your account and all associated data at any time by contacting support@luminapp.com.

Third-Party Services:
We may use third-party services for analytics and app performance monitoring. These services collect anonymized usage data and do not have access to your personal birth information.

Changes to This Policy:
We may update this Privacy Policy from time to time. We will notify you of any significant changes through the app or via email.

Contact:
For privacy-related inquiries, contact us at privacy@luminapp.com.`,
  },
  {
    slug: 'terms_of_service',
    title: 'Terms of Service',
    content: `Last updated: March 2026

Welcome to Lumin Guide. By using our application, you agree to these Terms of Service. Please read them carefully.

Acceptance of Terms:
By creating an account or using Lumin Guide, you agree to be bound by these terms. If you do not agree, please do not use our services.

Service Description:
Lumin Guide provides astrology-based content including horoscopes, birth chart analysis, compatibility readings, spiritual element guides, and community features. Our content is for entertainment and personal growth purposes and should not be used as a substitute for professional advice.

User Accounts:
You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate birth information for proper chart generation. You may not create multiple accounts or impersonate others.

Community Rules:
Users participating in our community features agree to be respectful and constructive. We prohibit hate speech, harassment, spam, and sharing of inappropriate content. We reserve the right to remove content and suspend accounts that violate these guidelines.

Intellectual Property:
All content, designs, and features of Lumin Guide are our intellectual property. You may not copy, modify, or distribute our content without written permission.

Disclaimer:
Astrological readings and spiritual guidance provided through Lumin Guide are for informational and entertainment purposes only. We make no guarantees about the accuracy of predictions or outcomes.

Limitation of Liability:
Lumin Guide shall not be liable for any indirect, incidental, or consequential damages arising from your use of our services.

Modifications:
We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the updated terms.

Contact:
For questions about these terms, email legal@luminapp.com.`,
  },
];

// ── Spiritual Elements (Herbs) ──────────────────────────
const herbsData = [
  { name: 'Lavender', type: 'herb', tag: 'Calming', description: 'Lavender is associated with peace, purification, and restful sleep. It resonates strongly with Virgo and Gemini energies, promoting mental clarity and emotional balance. Burn dried lavender or use its essential oil during meditation to enhance your connection to lunar energies.', iconUrl: '', order: 1 },
  { name: 'Rosemary', type: 'herb', tag: 'Protection', description: 'Rosemary is a powerful herb of protection and mental clarity, ruled by the Sun and connected to Leo energy. It enhances memory, wards off negative energy, and strengthens the aura. Place fresh rosemary at your doorway or carry a sprig for personal protection.', iconUrl: '', order: 2 },
  { name: 'Sage', type: 'herb', tag: 'Cleansing', description: 'White sage has been used for centuries in cleansing and purification rituals. Associated with Jupiter and Sagittarius, it clears stagnant energy from spaces and the aura. Burn a sage bundle and let the smoke purify your home, especially during new moon phases.', iconUrl: '', order: 3 },
  { name: 'Chamomile', type: 'herb', tag: 'Healing', description: 'Chamomile carries gentle, soothing Solar energy and is connected to the signs of Leo and Cancer. It promotes emotional healing, attracts abundance, and brings peaceful dreams. Drink chamomile tea before bed or add it to a bath for deep relaxation.', iconUrl: '', order: 4 },
  { name: 'Mugwort', type: 'herb', tag: 'Divination', description: 'Mugwort is the quintessential herb of psychic awareness and prophetic dreams, ruled by the Moon and deeply connected to Cancer and Pisces. Place it under your pillow for vivid dreams or burn it during divination practices to enhance your intuitive abilities.', iconUrl: '', order: 5 },
  { name: 'Basil', type: 'herb', tag: 'Prosperity', description: 'Basil is a powerful herb for attracting wealth, love, and protection. Ruled by Mars and associated with Aries and Scorpio, it brings courage and passion. Keep a basil plant on your windowsill to invite prosperity or carry dried leaves in your wallet.', iconUrl: '', order: 6 },
  { name: 'Thyme', type: 'herb', tag: 'Courage', description: 'Thyme is an herb of bravery, healing, and psychic awareness. Connected to Venus and the sign of Taurus, it was historically worn by warriors for courage. Use thyme in healing sachets or add it to ritual baths during times of transition and personal growth.', iconUrl: '', order: 7 },
  { name: 'Mint', type: 'herb', tag: 'Abundance', description: 'Mint carries vibrant Mercury energy and resonates with Gemini and Virgo. It stimulates mental agility, attracts financial abundance, and promotes communication. Rub fresh mint leaves between your fingers before important conversations or add to prosperity spells.', iconUrl: '', order: 8 },
  { name: 'Cinnamon', type: 'herb', tag: 'Success', description: 'Cinnamon is a fiery spice ruled by the Sun, associated with Aries and Leo. It accelerates spells, draws success, and raises spiritual vibrations. Blow cinnamon powder through your front door on the first of each month to invite abundance into your home.', iconUrl: '', order: 9 },
  { name: 'Bay Leaf', type: 'herb', tag: 'Manifestation', description: 'Bay laurel leaves are sacred to Apollo and carry Solar energy aligned with Leo and Sagittarius. They are powerful tools for manifestation and wish-granting. Write your intention on a dried bay leaf and burn it under a full moon to send your wishes to the universe.', iconUrl: '', order: 10 },
];

// ── Spiritual Elements (Crystals) ───────────────────────
const crystalsData = [
  { name: 'Amethyst', type: 'crystal', tag: 'Intuition', description: 'Amethyst is the stone of spiritual awareness and psychic protection, deeply connected to Pisces and the Third Eye chakra. Its violet energy calms the mind, enhances meditation, and strengthens intuitive abilities. Place it on your nightstand for peaceful sleep or hold during meditation.', iconUrl: '', order: 1 },
  { name: 'Rose Quartz', type: 'crystal', tag: 'Love', description: 'Rose Quartz is the universal stone of unconditional love, ruled by Venus and resonating with Taurus and Libra. It opens the Heart chakra, attracts romantic love, heals emotional wounds, and fosters self-compassion. Carry it daily or place it in your bedroom to invite loving energy.', iconUrl: '', order: 2 },
  { name: 'Clear Quartz', type: 'crystal', tag: 'Amplification', description: 'Known as the "Master Healer," Clear Quartz amplifies energy and intention. It resonates with all zodiac signs and chakras, making it the most versatile crystal. Program it with your intention by holding it during meditation. It also amplifies the energy of other crystals placed nearby.', iconUrl: '', order: 3 },
  { name: 'Black Tourmaline', type: 'crystal', tag: 'Protection', description: 'Black Tourmaline is the ultimate grounding and protection stone, connected to Capricorn and the Root chakra. It creates a powerful energy shield against negativity, electromagnetic frequencies, and psychic attacks. Place it near your front door or carry it during challenging situations.', iconUrl: '', order: 4 },
  { name: 'Citrine', type: 'crystal', tag: 'Abundance', description: 'Citrine radiates warm Solar energy and is the premier stone for manifesting wealth and success. Connected to Leo and the Solar Plexus chakra, it boosts confidence, creativity, and personal power. Keep it in your workspace or cash register to attract financial abundance.', iconUrl: '', order: 5 },
  { name: 'Moonstone', type: 'crystal', tag: 'New Beginnings', description: 'Moonstone carries the mystical energy of the Moon and is deeply connected to Cancer. It enhances intuition, promotes hormonal balance, and supports new beginnings. It is especially powerful during new and full moons. Wear it as jewelry to stay connected to lunar cycles.', iconUrl: '', order: 6 },
  { name: 'Lapis Lazuli', type: 'crystal', tag: 'Wisdom', description: 'Lapis Lazuli is the stone of truth, wisdom, and inner royalty, connected to Sagittarius and the Throat chakra. It enhances intellectual ability, stimulates desire for knowledge, and aids in honest communication. Meditate with it to access deeper understanding and spiritual insight.', iconUrl: '', order: 7 },
  { name: 'Tiger\'s Eye', type: 'crystal', tag: 'Confidence', description: 'Tiger\'s Eye is a stone of courage, willpower, and protection, ruled by the Sun and Mars. Connected to Leo and Capricorn, it sharpens focus, grounds scattered energy, and boosts self-confidence. Carry it when facing difficult decisions or wear it during job interviews.', iconUrl: '', order: 8 },
  { name: 'Selenite', type: 'crystal', tag: 'Cleansing', description: 'Selenite is a high-vibration crystal named after Selene, the Greek Moon goddess. It cleanses and charges other crystals, clears energy blockages, and connects you to higher consciousness. Place a selenite wand on your windowsill or use it to cleanse your aura by sweeping it around your body.', iconUrl: '', order: 9 },
  { name: 'Carnelian', type: 'crystal', tag: 'Vitality', description: 'Carnelian is a vibrant orange stone of motivation, endurance, and creative fire. Ruled by Mars and connected to Aries and Leo, it activates the Sacral chakra, ignites passion, and dispels apathy. Wear it to boost energy during workouts or creative projects.', iconUrl: '', order: 10 },
];

// ════════════════════════════════════════════════════════
//  SEED FUNCTIONS
// ════════════════════════════════════════════════════════

async function seedUsers() {
  console.log('  Seeding users...');
  const created = [];
  for (const u of usersData) {
    const exists = await User.findOne({ email: u.email });
    if (exists) {
      console.log(`    ⤳ Skipped (exists): ${u.email}`);
      created.push(exists);
      continue;
    }
    const user = await User.create(u); // password hashed by pre-save hook
    console.log(`    ✓ Created: ${u.email} (${u.role})`);
    created.push(user);
  }
  return created;
}

async function seedBirthCharts(users) {
  console.log('  Seeding birth charts...');
  const charts = [
    {
      userId: users[1]._id, // Aria
      dateOfBirth: '1995-03-21',
      timeOfBirth: '14:00',
      placeOfBirth: 'Los Angeles',
      country: 'US',
      bigThree: [
        { label: 'Sun in Aries', sub: 'Bold, courageous, pioneering spirit' },
        { label: 'Moon in Cancer', sub: 'Deeply emotional, nurturing, protective' },
        { label: 'Rising in Scorpio', sub: 'Magnetic presence, intense first impression' },
      ],
      chartPattern: 'Bowl',
      dominantElement: 'Water',
      dominantQuality: 'Cardinal',
      planets: [
        { name: 'Sun', house: '5th House' },
        { name: 'Moon', house: '8th House' },
        { name: 'Mercury', house: '4th House' },
        { name: 'Venus', house: '6th House' },
        { name: 'Mars', house: '9th House' },
        { name: 'Jupiter', house: '12th House' },
        { name: 'Saturn', house: '3rd House' },
      ],
      houses: [
        { house: '1st House', meaning: 'Self-identity and first impressions — Scorpio rising gives you a magnetic aura' },
        { house: '4th House', meaning: 'Home and roots — Mercury here brings a thoughtful home environment' },
        { house: '5th House', meaning: 'Creativity and joy — Sun in Aries lights up your creative expression' },
        { house: '7th House', meaning: 'Partnerships — Taurus energy brings stability to relationships' },
        { house: '10th House', meaning: 'Career and public image — Leo energy draws you to leadership roles' },
      ],
    },
    {
      userId: users[2]._id, // Leo
      dateOfBirth: '1992-07-28',
      timeOfBirth: '22:15',
      placeOfBirth: 'Chicago',
      country: 'US',
      bigThree: [
        { label: 'Sun in Leo', sub: 'Charismatic, generous, natural leader' },
        { label: 'Moon in Aquarius', sub: 'Independent thinker, humanitarian ideals' },
        { label: 'Rising in Taurus', sub: 'Calm demeanor, strong physical presence' },
      ],
      chartPattern: 'Seesaw',
      dominantElement: 'Fire',
      dominantQuality: 'Fixed',
      planets: [
        { name: 'Sun', house: '4th House' },
        { name: 'Moon', house: '10th House' },
        { name: 'Mercury', house: '3rd House' },
        { name: 'Venus', house: '5th House' },
        { name: 'Mars', house: '1st House' },
        { name: 'Jupiter', house: '7th House' },
        { name: 'Saturn', house: '11th House' },
      ],
      houses: [
        { house: '1st House', meaning: 'Self-identity — Mars in Taurus gives you determined, steady energy' },
        { house: '4th House', meaning: 'Home and family — Sun in Leo fills your home with warmth and pride' },
        { house: '7th House', meaning: 'Partnerships — Jupiter expands your relationship horizons' },
        { house: '10th House', meaning: 'Career — Aquarius Moon drives innovation in your professional life' },
      ],
    },
  ];

  for (const chart of charts) {
    const exists = await BirthChart.findOne({ userId: chart.userId });
    if (exists) {
      console.log('    ⤳ Skipped (exists): chart for user ' + chart.userId);
      continue;
    }
    await BirthChart.create(chart);
    console.log('    ✓ Created chart for: ' + chart.placeOfBirth);
  }
}

async function seedFaqs() {
  console.log('  Seeding FAQs...');
  for (const faq of faqsData) {
    const exists = await Faq.findOne({ question: faq.question });
    if (exists) {
      console.log(`    ⤳ Skipped (exists): "${faq.question.substring(0, 40)}..."`);
      continue;
    }
    await Faq.create(faq);
    console.log(`    ✓ Created FAQ: "${faq.question.substring(0, 40)}..."`);
  }
}

async function seedPages() {
  console.log('  Seeding page content...');
  for (const page of pagesData) {
    const exists = await PageContent.findOne({ slug: page.slug });
    if (exists) {
      console.log(`    ⤳ Skipped (exists): ${page.slug}`);
      continue;
    }
    await PageContent.create(page);
    console.log(`    ✓ Created page: ${page.slug}`);
  }
}

async function seedSpiritualElements() {
  console.log('  Seeding spiritual elements...');
  const all = [...herbsData, ...crystalsData];
  for (const el of all) {
    const exists = await SpiritualElement.findOne({ name: el.name, type: el.type });
    if (exists) {
      console.log(`    ⤳ Skipped (exists): ${el.name} (${el.type})`);
      continue;
    }
    await SpiritualElement.create(el);
    console.log(`    ✓ Created ${el.type}: ${el.name}`);
  }
}

async function seedPosts(users) {
  console.log('  Seeding community posts...');
  const postsData = [
    {
      userId: users[1]._id,
      title: 'Mercury retrograde survival tips!',
      body: 'Hey everyone! Mercury retrograde is coming up again and I wanted to share some tips that have helped me survive past retrogrades. First, back up all your devices. Second, double-check all travel plans and appointments. Third, avoid signing contracts if possible. And most importantly — be patient with communication mishaps! What are your go-to retrograde rituals?',
      author: users[1].fullName,
      likes: 12,
      comments: [
        { userId: users[2]._id, author: users[2].fullName, text: 'Great tips! I always carry extra black tourmaline during retrograde. It helps ground my energy and protects against the chaos.', timeAgo: '2h ago' },
        { userId: users[3]._id, author: users[3].fullName, text: 'Mercury retrograde is actually a great time for re-visiting old projects. I use it as a review period!', timeAgo: '1h ago' },
      ],
    },
    {
      userId: users[3]._id,
      title: 'Full Moon in Pisces experience',
      body: 'Last night\'s full moon in Pisces was absolutely transformative. I did a releasing ritual with selenite and lavender, and I have to say the energy was incredible. I journaled for about an hour and had some really powerful realizations about patterns I\'ve been repeating. Anyone else feel the shift?',
      author: users[3].fullName,
      likes: 8,
      comments: [
        { userId: users[4]._id, author: users[4].fullName, text: 'I felt it so strongly! As a Virgo, the Pisces full moon always hits me hard since it\'s my opposite sign. Very emotional but cleansing.', timeAgo: '5h ago' },
      ],
    },
    {
      userId: users[2]._id,
      title: 'Best crystals for Leos?',
      body: 'Fellow Leo here! I\'m looking to expand my crystal collection with stones that really resonate with Leo energy. Currently I have citrine and tiger\'s eye which I love. What other crystals do you Leos work with? Especially interested in anything that helps with the shadow side of Leo (ego, stubbornness).',
      author: users[2].fullName,
      likes: 15,
      comments: [
        { userId: users[1]._id, author: users[1].fullName, text: 'Sunstone is amazing for Leos — it amplifies your natural warmth. For the shadow side, try labradorite. It helps with self-reflection without dimming your light.', timeAgo: '3h ago' },
        { userId: users[3]._id, author: users[3].fullName, text: 'Peridot is the traditional Leo birthstone and it\'s wonderful for releasing jealousy and ego patterns. Highly recommend!', timeAgo: '2h ago' },
        { userId: users[4]._id, author: users[4].fullName, text: 'Carnelian! It boosts creativity and confidence which Leos thrive on, but also keeps you grounded.', timeAgo: '1h ago' },
      ],
    },
    {
      userId: users[4]._id,
      title: 'Beginner\'s guide to reading your birth chart',
      body: 'I\'ve been studying astrology for a few years now and wanted to share some tips for beginners looking at their birth chart for the first time. Start with your Big Three (Sun, Moon, Rising) — this gives you the foundation. Then look at where your personal planets (Mercury, Venus, Mars) fall. Don\'t get overwhelmed by aspects and houses right away. Take it one step at a time and enjoy the journey of self-discovery!',
      author: users[4].fullName,
      likes: 22,
      comments: [
        { userId: users[1]._id, author: users[1].fullName, text: 'This is so helpful! When I first looked at my chart I was totally lost. Focusing on the Big Three first is great advice.', timeAgo: '4h ago' },
      ],
    },
  ];

  for (const post of postsData) {
    const exists = await Post.findOne({ title: post.title });
    if (exists) {
      console.log(`    ⤳ Skipped (exists): "${post.title.substring(0, 40)}..."`);
      continue;
    }
    await Post.create(post);
    console.log(`    ✓ Created post: "${post.title.substring(0, 40)}..."`);
  }
}

async function seedJournalEntries(users) {
  console.log('  Seeding journal entries...');
  const journalData = [
    {
      userId: users[1]._id,
      title: 'New Moon Intentions - March',
      body: 'Setting my intentions for this lunar cycle:\n\n1. Practice daily meditation for at least 10 minutes\n2. Work on my throat chakra — I\'ve been holding back my truth lately\n3. Start a gratitude practice before bed\n4. Connect with nature at least 3 times this week\n\nThe Aries new moon feels like the perfect fresh start. I drew the Ace of Wands in my tarot reading which confirms this is a time for bold new beginnings.',
    },
    {
      userId: users[1]._id,
      title: 'Venus Transit Reflections',
      body: 'Venus moved into my 7th house today and I can already feel the shift in my relationship energy. I\'m feeling more open and receptive. Had a really meaningful conversation with my partner about our future. The energy feels soft and supportive. Going to work with rose quartz this week to amplify this loving transit.',
    },
    {
      userId: users[3]._id,
      title: 'Saturn Return Journal',
      body: 'Month 3 of my Saturn return and things are intense. Career changes, relationship evaluations, deep questioning of my life path. It\'s uncomfortable but I know it\'s necessary growth. My astrologer said this is the universe\'s way of ensuring I\'m building on a solid foundation. Using black tourmaline and smoky quartz for grounding during this transformative period.',
    },
    {
      userId: users[4]._id,
      title: 'Dream Log - Pisces Season',
      body: 'The dreams during Pisces season have been incredibly vivid. Last night I dreamed of swimming in a vast purple ocean with whales singing around me. According to my dream astrology book, water dreams during Pisces season indicate deep emotional processing. I placed amethyst and moonstone under my pillow as suggested in the crystal guide. Going to track my dreams all month.',
    },
  ];

  for (const entry of journalData) {
    const exists = await JournalEntry.findOne({ userId: entry.userId, title: entry.title });
    if (exists) {
      console.log(`    ⤳ Skipped (exists): "${entry.title.substring(0, 40)}..."`);
      continue;
    }
    await JournalEntry.create(entry);
    console.log(`    ✓ Created journal: "${entry.title.substring(0, 40)}..."`);
  }
}

// ════════════════════════════════════════════════════════
//  MAIN
// ════════════════════════════════════════════════════════

const COLLECTIONS = {
  users: seedUsers,
  birthcharts: (users) => seedBirthCharts(users),
  faqs: seedFaqs,
  pages: seedPages,
  spiritual: seedSpiritualElements,
  posts: (users) => seedPosts(users),
  journals: (users) => seedJournalEntries(users),
};

async function main() {
  console.log('\n═══════════════════════════════════════');
  console.log(' Lumin Guide — Database Seeder');
  console.log('═══════════════════════════════════════\n');
  console.log(`MongoDB: ${MONGODB_URI}`);
  console.log(`Mode: ${FRESH ? 'FRESH (dropping data first)' : 'Safe (skip existing)'}`);
  if (ONLY) console.log(`Collection: ${ONLY} only`);
  console.log('');

  await mongoose.connect(MONGODB_URI);
  console.log('✓ Connected to MongoDB\n');

  if (FRESH) {
    console.log('Dropping existing data...');
    const models = [User, BirthChart, Faq, JournalEntry, PageContent, Post, SpiritualElement];
    for (const Model of models) {
      if (ONLY && !Model.modelName.toLowerCase().includes(ONLY)) continue;
      await Model.deleteMany({});
      console.log(`  ✗ Dropped: ${Model.modelName}`);
    }
    console.log('');
  }

  // Users must go first (other collections reference user IDs)
  let users = [];
  if (!ONLY || ONLY === 'users') {
    users = await seedUsers();
  } else {
    // Still need user refs for dependent collections
    users = await User.find().lean();
  }

  // Seed remaining collections
  const toSeed = ONLY ? [ONLY] : Object.keys(COLLECTIONS).filter((k) => k !== 'users');

  for (const key of toSeed) {
    if (key === 'users') continue;
    const fn = COLLECTIONS[key];
    if (!fn) {
      console.log(`  ⚠ Unknown collection: ${key}`);
      continue;
    }
    // Some seeders need the users array
    if (['birthcharts', 'posts', 'journals'].includes(key)) {
      if (users.length < 2) {
        console.log(`  ⚠ Skipping ${key} — need at least 2 users (seed users first)`);
        continue;
      }
      await fn(users);
    } else {
      await fn();
    }
  }

  console.log('\n═══════════════════════════════════════');
  console.log(' ✓ Seeding complete!');
  console.log('═══════════════════════════════════════');
  console.log('\n Admin login:  admin@lumin.app / Admin@123\n');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('\n✗ Seed error:', err.message);
  process.exit(1);
});
