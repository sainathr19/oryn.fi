import { z } from 'zod';
import * as fs from 'fs';

const ConfigSchema = z.object({
  port: z.number().default(3000)
});

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(configPath?: string): Config {
  const path = configPath || 'config.json';
  
  let fileConfig = {};
  
  if (fs.existsSync(path)) {
    const fileContent = fs.readFileSync(path, 'utf8');
    fileConfig = JSON.parse(fileContent);
  }
  
  return ConfigSchema.parse(fileConfig);
}
