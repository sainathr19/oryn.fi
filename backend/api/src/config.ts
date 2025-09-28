import { z } from 'zod';
import * as fs from 'fs';

const ConfigSchema = z.object({
  port: z.number().default(3000),
  coingecko: z.object({
    apiUrl: z.string().default('https://api.coingecko.com/api/v3/simple/price'),
    apiKey: z.string().optional()
  }).default({}),
  blockchain: z.object({
    rpcUrl: z.string(),
    nftManagerAddress: z.string()
  })
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
