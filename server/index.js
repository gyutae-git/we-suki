import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize data file if missing
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ submissions: [], cocktails: null }, null, 2), 'utf-8');
}

function readData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch {
    return { submissions: [], cocktails: null };
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// GET all submissions
app.get('/api/submissions', (req, res) => {
  const data = readData();
  res.json(data.submissions ?? []);
});

// GET all cocktails
app.get('/api/cocktails', (req, res) => {
  const data = readData();
  res.json({ cocktails: data.cocktails });
});

// PUT (overwrite) all cocktails
app.put('/api/cocktails', (req, res) => {
  const { cocktails } = req.body;
  if (!Array.isArray(cocktails)) {
    return res.status(400).json({ error: 'Cocktails must be an array' });
  }
  const data = readData();
  data.cocktails = cocktails;
  writeData(data);
  res.json({ ok: true });
});

// GET custom metrics
app.get('/api/metrics', (req, res) => {
  const data = readData();
  res.json({ metrics: data.metrics || null });
});

// PUT custom metrics
app.put('/api/metrics', (req, res) => {
  const { metrics } = req.body;
  if (!Array.isArray(metrics)) {
    return res.status(400).json({ error: 'Metrics must be an array' });
  }
  const data = readData();
  data.metrics = metrics;
  writeData(data);
  res.json({ ok: true });
});

// POST new submission
app.post('/api/submissions', (req, res) => {
  const { cocktailId, cocktailName, scores } = req.body;
  if (!cocktailId || !cocktailName || !scores) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const data = readData();
  const entry = {
    id: Date.now(),
    cocktailId,
    cocktailName,
    scores,
    submittedAt: new Date().toISOString(),
  };
  data.submissions.push(entry);
  writeData(data);
  res.status(201).json(entry);
});

// DELETE one submission
app.delete('/api/submissions/:id', (req, res) => {
  const data = readData();
  const before = data.submissions.length;
  data.submissions = data.submissions.filter(s => s.id !== Number(req.params.id));
  if (data.submissions.length === before) {
    return res.status(404).json({ error: 'Not found' });
  }
  writeData(data);
  res.json({ ok: true });
});

// DELETE all submissions
app.delete('/api/submissions', (req, res) => {
  writeData({ submissions: [] });
  res.json({ ok: true });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ we:好き API  →  http://localhost:${PORT}`);
});
