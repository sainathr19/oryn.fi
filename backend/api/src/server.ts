import express from 'express';
import { loadConfig } from './config';

export function createServer() {
  const config = loadConfig();
  const app = express();

  // Health endpoint
  app.get('/health', (req, res) => {
    res.send('Online');
  });

  return { app, config };
}
