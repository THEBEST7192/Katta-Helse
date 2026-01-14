import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import sql from './db.js';

const app = express();
const port = process.env.PORT || 6767;

// Generell rate limiter for alle forespørsler
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'For mange forespørsler, vennligst prøv igjen senere.' }
});

// Strengere limiter for innlogging og reservasjoner
const strictLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'For mange forsøk fra denne IP-adressen. Vennligst vent 10 minutter.' }
});

app.use(globalLimiter);

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()) 
  : ['http://localhost:8001'];

app.use(cors({
  origin: (origin, callback) => {
    // Tillat forespørsler uten origin (som mobilapper eller curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked for origin: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true
}));
app.use(express.json());

const initDb = async () => {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS reservations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        time TIME NOT NULL,
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('Database initialized');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
};

initDb();

app.post('/api/login', strictLimiter, (req, res) => {
  const { password } = req.body;
  const correctPassword = process.env.DOCTOR_PASSWORD || 'katta123';

  if (password === correctPassword) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: 'Feil passord' });
  }
});

app.post('/api/reservations', strictLimiter, async (req, res) => {
  const { name, email, date, time, message } = req.body;

  if (!name || !email || !date || !time) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const [result] = await sql`
      INSERT INTO reservations (name, email, date, time, message) 
      VALUES (${name}, ${email}, ${date}, ${time}, ${message}) 
      RETURNING *
    `;
    res.status(201).json(result);
  } catch (err) {
    console.error('Error saving reservation:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/reservations', async (req, res) => {
  const authHeader = req.headers.authorization;
  const correctPassword = process.env.DOCTOR_PASSWORD || 'katta123';

  if (authHeader !== correctPassword) {
    return res.status(401).json({ error: 'Uautorisert tilgang' });
  }

  try {
    const reservations = await sql`
      SELECT * FROM reservations 
      WHERE date > CURRENT_DATE 
      OR (date = CURRENT_DATE AND time >= date_trunc('hour', CURRENT_TIME::time))
      ORDER BY date ASC, time ASC
    `;
    res.json(reservations);
  } catch (err) {
    console.error('Error fetching reservations:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/reservations/public', async (req, res) => {
  try {
    const reservations = await sql`
      SELECT date, time FROM reservations 
      WHERE date > CURRENT_DATE 
      OR (date = CURRENT_DATE AND time >= date_trunc('hour', CURRENT_TIME::time))
      ORDER BY date ASC, time ASC
    `;
    res.json(reservations);
  } catch (err) {
    console.error('Error fetching public reservations:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
