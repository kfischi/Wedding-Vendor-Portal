const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const express = require('express');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;
const API_KEY = process.env.API_KEY || 'change-me-in-env';

// ─── WhatsApp Client ──────────────────────────────────────────────────────────

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  },
});

let isReady = false;
let lastQR = null;

client.on('qr', (qr) => {
  lastQR = qr;
  isReady = false;
  qrcode.generate(qr, { small: true });
  console.log('\n✅ סרוק את ה-QR בוואטסאפ שלך (Settings → Linked Devices → Link a Device)\n');
});

client.on('ready', () => {
  isReady = true;
  lastQR = null;
  console.log('✅ WhatsApp מחובר ומוכן לשליחה');
});

client.on('authenticated', () => {
  console.log('🔐 אימות הצליח — Session נשמרת');
});

client.on('auth_failure', (msg) => {
  console.error('❌ כשל אימות:', msg);
  isReady = false;
});

client.on('disconnected', (reason) => {
  console.warn('⚠️ התנתק:', reason);
  isReady = false;
});

client.initialize();

// ─── Middleware: בדיקת API Key ─────────────────────────────────────────────────

function requireApiKey(req, res, next) {
  const key = req.headers['x-api-key'];
  if (!key || key !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// בריאות השירות
app.get('/health', (req, res) => {
  res.json({ status: isReady ? 'ready' : 'not_ready', timestamp: new Date().toISOString() });
});

// QR Code כתמונה (לסקירה בדפדפן)
app.get('/qr', async (req, res) => {
  if (isReady) return res.json({ status: 'already_connected' });
  if (!lastQR) return res.status(503).json({ error: 'QR not available yet, try again in a few seconds' });

  try {
    const imageBuffer = await QRCode.toBuffer(lastQR, { type: 'png', width: 300 });
    res.setHeader('Content-Type', 'image/png');
    res.send(imageBuffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// שליחת הודעה
app.post('/send', requireApiKey, async (req, res) => {
  const { phone, message } = req.body;

  if (!phone || !message) {
    return res.status(400).json({ error: 'phone and message are required' });
  }

  if (!isReady) {
    return res.status(503).json({ error: 'WhatsApp not ready', hint: 'Check /health or scan QR at /qr' });
  }

  // נרמול מספר ישראלי: 05xxxxxxxx → 97205xxxxxxxx@c.us
  const normalized = normalizePhone(phone);
  if (!normalized) {
    return res.status(400).json({ error: 'Invalid phone number format' });
  }

  try {
    const chatId = `${normalized}@c.us`;

    // בדיקה שהמספר קיים בוואטסאפ
    const isRegistered = await client.isRegisteredUser(chatId);
    if (!isRegistered) {
      return res.status(404).json({ error: 'Phone not registered on WhatsApp', phone: normalized });
    }

    await client.sendMessage(chatId, message);
    console.log(`📤 נשלח ל-${normalized}`);
    res.json({ success: true, to: normalized });
  } catch (err) {
    console.error('שגיאת שליחה:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// שליחה למספר מספרים (batch)
app.post('/send-batch', requireApiKey, async (req, res) => {
  const { messages } = req.body; // [{ phone, message }, ...]

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array required' });
  }

  if (!isReady) {
    return res.status(503).json({ error: 'WhatsApp not ready' });
  }

  const results = [];

  for (const { phone, message } of messages) {
    const normalized = normalizePhone(phone);
    if (!normalized) {
      results.push({ phone, success: false, error: 'invalid phone' });
      continue;
    }
    try {
      const chatId = `${normalized}@c.us`;
      await client.sendMessage(chatId, message);
      results.push({ phone: normalized, success: true });
      // השהייה קצרה בין הודעות למניעת חסימה
      await sleep(800);
    } catch (err) {
      results.push({ phone: normalized, success: false, error: err.message });
    }
  }

  res.json({ results });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizePhone(phone) {
  // הסרת תווים שאינם ספרות
  const digits = String(phone).replace(/\D/g, '');

  if (digits.startsWith('972') && digits.length >= 12) return digits; // כבר בפורמט בינלאומי
  if (digits.startsWith('0') && digits.length === 10) return '972' + digits.slice(1); // 05x → 9725x
  if (digits.length === 9 && digits.startsWith('5')) return '972' + digits; // 5xxxxxxxx
  return null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🚀 WhatsApp Service פועל על פורט ${PORT}`);
  console.log(`📡 /health  — בדיקת סטטוס`);
  console.log(`📷 /qr      — QR Code לסריקה`);
  console.log(`📤 POST /send { phone, message } + Header: x-api-key\n`);
});
