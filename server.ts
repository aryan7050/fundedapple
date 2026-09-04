import app from './app.js';
import { config } from './config/env.js';

app.listen(config.port, () => {
  console.log(`Fundedapple backend running on http://localhost:${config.port}`);
});
