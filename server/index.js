import express from 'express';
import cors from 'cors';
import sql from './db.js';

const app = express();
const port = process.env.PORT || 6767;

// Mellomvare
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:8001'];

app.use(cors({
  origin: (origin, callback) => {
    // Tillat kun forespørsler med en definert origin som er i hvitlisten
    if (!origin || allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json());

// Initialiser databasetabell
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

// Ruter
app.post('/api/reservations', async (req, res) => {
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
  try {
    const reservations = await sql`
      SELECT * FROM reservations ORDER BY created_at DESC
    `;
    res.json(reservations);
  } catch (err) {
    console.error('Error fetching reservations:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
