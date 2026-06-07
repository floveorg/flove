import express from 'express';
import cookieParser from 'cookie-parser';
import { initDb } from './db/pool.js';
import { loadUser } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import formsRoutes from './routes/forms.js';
import scoresRoutes from './routes/scores.js';
import eventsRoutes from './routes/events.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, _res, next) => {
  console.log('>>>', req.method, req.url);
  next();
});

app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(loadUser);

app.use('/api/auth', authRoutes);
app.use('/api/forms', formsRoutes);
app.use('/api/scores', scoresRoutes);
app.use('/api/events', eventsRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

async function start() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`flove API running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start:', err);
    process.exit(1);
  }
}

start();
