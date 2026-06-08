import { serve } from '@hono/node-server';
import app from './src/index.js';

const port = parseInt(process.env.PORT || '8787', 10);

console.log(`\n🪶 OpenGrammar Backend starting on http://localhost:${port}\n`);

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`✅ Server ready on http://localhost:${info.port}`);
  },
);
