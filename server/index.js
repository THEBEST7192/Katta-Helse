import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import sql from './db.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '.env.local'), override: true });

const app = express();
const port = process.env.PORT || 6767;

// Stol på proxy-headere (nødvendig for Cloudflare/proxy)
app.set('trust proxy', 1);

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS
      .split(',')
      .map(origin => origin.replace(/[\s`"']/g, '').replace(/\/$/, ''))
      .filter(Boolean)
  : ['http://localhost:8081', 'https://helse.the-diddy.party'];

console.log('Serveren starter med tillatte origins:', allowedOrigins);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const normalizedOrigin = origin.replace(/[\s`"']/g, '').replace(/\/$/, '');
    if (allowedOrigins.includes(normalizedOrigin)) {
      callback(null, true);
    } else {
      console.warn(`CORS AVVIST: "${origin}" er ikke i [${allowedOrigins.join(', ')}]`);
      callback(null, false);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

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

// Health check endepunkt
app.get('/api/health', globalLimiter, (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(globalLimiter);
app.use(express.json());

const initDb = async () => {
  try {
    // 1. Opprett tabeller for normaliserte data hvis de ikke eksisterer
    await sql`
      CREATE TABLE IF NOT EXISTS emails (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS phones (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(255) UNIQUE NOT NULL
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email_id INTEGER REFERENCES emails(id),
        phone_id INTEGER REFERENCES phones(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS doctors (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    // 2. Sjekk om det finnes noen leger, hvis ikke skriv ut en advarsel
    const doctors = await sql`SELECT COUNT(*) FROM doctors`;
    if (parseInt(doctors[0].count) === 0) {
      console.warn('ADVARSEL: Ingen leger er registrert i databasen. Systemet vil ikke tillate innlogging.');
      console.warn('Vennligst opprett en lege manuelt i "doctors"-tabellen.');
    }
    const tableInfo = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'reservations' AND column_name = 'email';
    `;

    if (tableInfo.length > 0) {
      console.log('Gammel reservations-tabell oppdaget. Starter datamigrering...');
      
      await sql.begin(async (sql) => {
        // Hent alle gamle reservasjoner
        const oldReservations = await sql`SELECT * FROM reservations`;
        
        // Midlertidig tabell for å holde den nye strukturen
        await sql`
          CREATE TABLE reservations_new (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            date DATE NOT NULL,
            time TIME NOT NULL,
            message TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `;

        for (const res of oldReservations) {
          const isEmail = res.email.includes('@');
          let emailId = null;
          let phoneId = null;

          if (isEmail) {
            const [emailRow] = await sql`
              INSERT INTO emails (email) VALUES (${res.email})
              ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
              RETURNING id
            `;
            emailId = emailRow.id;
          } else {
            const [phoneRow] = await sql`
              INSERT INTO phones (phone) VALUES (${res.email})
              ON CONFLICT (phone) DO UPDATE SET phone = EXCLUDED.phone
              RETURNING id
            `;
            phoneId = phoneRow.id;
          }

          // Opprett bruker for denne reservasjonen
          const [userRow] = await sql`
            INSERT INTO users (name, email_id, phone_id)
            VALUES (${res.name}, ${emailId}, ${phoneId})
            RETURNING id
          `;
          
          // Sett inn i den nye reservasjonstabellen
          await sql`
            INSERT INTO reservations_new (user_id, date, time, message, created_at)
            VALUES (${userRow.id}, ${res.date}, ${res.time}, ${res.message}, ${res.created_at})
          `;
        }

        // Slett gammel tabell og gi nytt navn til den nye
        await sql`DROP TABLE reservations`;
        await sql`ALTER TABLE reservations_new RENAME TO reservations`;
      });
      
      console.log('Migrering fullført.');
    } else {
      // Hvis tabellen ikke eksisterer i det hele tatt, opprett den med det nye skjemaet
      await sql`
        CREATE TABLE IF NOT EXISTS reservations (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          date DATE NOT NULL,
          time TIME NOT NULL,
          message TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
    }
    
    console.log('Database initialisert med normalisert skjema');
  } catch (err) {
    console.error('Feil ved initialisering av database:', err);
  }
};

initDb();

const reservationRetentionDaysEnv = parseInt(process.env.RESERVATION_RETENTION_DAYS || '1', 10); // 1 day, base 10
const reservationRetentionDays = Number.isNaN(reservationRetentionDaysEnv) ? 1 : reservationRetentionDaysEnv;
const cleanupIntervalMs = 24 * 60 * 60 * 1000;

const cleanupOldReservations = async () => {
  try {
    await sql.begin(async (sql) => {
      // 1. Slett gamle reservasjoner
      await sql`
        DELETE FROM reservations
        WHERE CURRENT_DATE - date > ${reservationRetentionDays}
      `;
      
      // 2. Slett brukere som ikke lenger har noen reservasjoner
      await sql`
        DELETE FROM users
        WHERE id NOT IN (SELECT user_id FROM reservations)
      `;
      
      // 3. Slett e-poster som ikke lenger er knyttet til noen bruker
      await sql`
        DELETE FROM emails
        WHERE id NOT IN (SELECT email_id FROM users WHERE email_id IS NOT NULL)
      `;
      
      // 4. Slett telefonnumre som ikke lenger er knyttet til noen bruker
      await sql`
        DELETE FROM phones
        WHERE id NOT IN (SELECT phone_id FROM users WHERE phone_id IS NOT NULL)
      `;
    });
    console.log(`Opprydding av gamle reservasjoner og tilhørende data fullført (oppbevaring ${reservationRetentionDays} dager)`);
  } catch (err) {
    console.error('Feil ved opprydding av gamle reservasjoner:', err);
  }
};

setInterval(() => {
  cleanupOldReservations().catch(err => {
    console.error('Feil i planlagt opprydding av reservasjoner:', err);
  });
}, cleanupIntervalMs);

cleanupOldReservations().catch(err => {
  console.error('Feil ved kjøring av første opprydding av reservasjoner:', err);
});

app.get('/api/doctors/check', async (req, res) => {
  try {
    const result = await sql`SELECT COUNT(*) FROM doctors`;
    const count = parseInt(result[0].count);
    res.json({ hasDoctors: count > 0 });
  } catch (err) {
    res.status(500).json({ error: 'Kunne ikke sjekke legestatus' });
  }
});

app.post('/api/login', strictLimiter, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Brukernavn og passord er påkrevd' });
  }

  try {
    const [doctor] = await sql`
      SELECT * FROM doctors WHERE username = ${username}
    `;

    if (doctor && await bcrypt.compare(password, doctor.password_hash)) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, error: 'Feil brukernavn eller passord' });
    }
  } catch (err) {
    console.error('Innloggingsfeil:', err);
    res.status(500).json({ success: false, error: 'Intern serverfeil' });
  }
});

app.post('/api/reservations', strictLimiter, async (req, res) => {
  const { name, email, date, time, message } = req.body;

  if (!name || !email || !date || !time) {
    return res.status(400).json({ error: 'Alle felt er obligatoriske' });
  }

  try {
    // Start en transaksjon
    const result = await sql.begin(async (sql) => {
      // Sjekk om det er e-post eller telefonnummer
      const isEmailAddress = email.includes('@');
      let emailId = null;
      let phoneId = null;

      if (isEmailAddress) {
        const [emailRow] = await sql`
          INSERT INTO emails (email) VALUES (${email})
          ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
          RETURNING id
        `;
        emailId = emailRow.id;
      } else {
        const [phoneRow] = await sql`
          INSERT INTO phones (phone) VALUES (${email})
          ON CONFLICT (phone) DO UPDATE SET phone = EXCLUDED.phone
          RETURNING id
        `;
        phoneId = phoneRow.id;
      }

      // Opprett en ny brukerpost for denne reservasjonen
      const [userRow] = await sql`
        INSERT INTO users (name, email_id, phone_id)
        VALUES (${name}, ${emailId}, ${phoneId})
        RETURNING id
      `;
      const userId = userRow.id;

      const [reservation] = await sql`
        INSERT INTO reservations (user_id, date, time, message) 
        VALUES (${userId}, ${date}, ${time}, ${message}) 
        RETURNING *
      `;
      return reservation;
    });

    res.status(201).json(result);
  } catch (err) {
    console.error('Feil ved lagring av reservasjon:', err);
    res.status(500).json({ error: 'Intern serverfeil' });
  }
});

app.get('/api/reservations', async (req, res) => {
  const username = req.headers['x-username'];
  const password = req.headers['x-password'];

  if (!username || !password) {
    return res.status(401).json({ error: 'Uautorisert tilgang: Brukernavn og passord mangler' });
  }

  try {
    const [doctor] = await sql`
      SELECT * FROM doctors WHERE username = ${username}
    `;

    if (!doctor || !(await bcrypt.compare(password, doctor.password_hash))) {
      return res.status(401).json({ error: 'Uautorisert tilgang: Feil legitimasjon' });
    }

    const reservations = await sql`
      SELECT 
        r.id, 
        u.name, 
        COALESCE(e.email, p.phone) as email,
        r.date, 
        r.time, 
        r.message, 
        r.created_at
      FROM reservations r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN emails e ON u.email_id = e.id
      LEFT JOIN phones p ON u.phone_id = p.id
      WHERE r.date > CURRENT_DATE 
      OR (r.date = CURRENT_DATE AND r.time >= CURRENT_TIME)
      ORDER BY r.date ASC, r.time ASC
    `;
    res.json(reservations);
  } catch (err) {
    console.error('Feil ved henting av reservasjoner:', err);
    res.status(500).json({ 
      error: 'Intern serverfeil',
      message: err.message
    });
  }
});

app.get('/api/reservations/public', async (req, res) => {
  try {
    const reservations = await sql`
      SELECT date, time FROM reservations 
      WHERE date > CURRENT_DATE 
      OR (date = CURRENT_DATE AND time >= CURRENT_TIME)
      ORDER BY date ASC, time ASC
    `;
    res.json(reservations);
  } catch (err) {
    console.error('DATABASEFEIL på /api/reservations/public:', err);
    res.status(500).json({ 
      error: 'Intern serverfeil', 
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Global feilhåndtering
app.use((err, req, res, next) => {
  console.error('Uhåndtert feil:', err);
  res.status(500).json({ 
    error: 'Intern serverfeil',
    message: err.message 
  });
});

app.listen(port, () => {
  console.log(`Serveren kjører på port ${port}`);
});
