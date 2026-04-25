import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// If you change the GitHub repo name, update the base path below to match.
// Site will be served at: https://<user>.github.io/<repo>/
export default defineConfig({
  plugins: [react()],
  base: '/ventuno/',
});
