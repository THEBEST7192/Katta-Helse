import express from 'express';
import cors from 'cors';
import sql from './db.js';

const app = express();
const port = process.env.PORT || 6767;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database table
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

// Routes
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
