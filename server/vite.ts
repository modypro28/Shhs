import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Fix ESM dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use __dirname for vite middleware path resolution
const viteMiddlewarePath = `${__dirname}/path/to/middleware`;

// Rest of your Vite setup code here...