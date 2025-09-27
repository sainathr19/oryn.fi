import express from 'express';
import { loadConfig } from './config';

const config = loadConfig();
const app = express();

// Health endpoint
app.get('/health', (req, res) => {
  res.send('Online');
});

app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
});
