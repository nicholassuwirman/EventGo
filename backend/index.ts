import express from 'express';
import cors from 'cors';
import eventsRouter from './routes/events';
import participantsRouter from './routes/participants';
import tagsRouter from './routes/tags';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString()});
});

// Use modular routers
app.use('/api/events', eventsRouter);
app.use('/api/participants', participantsRouter);
app.use('/api/tags', tagsRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Events API: http://localhost:${PORT}/api/events`);
  console.log(`Participants API: http://localhost:${PORT}/api/participants`);
});