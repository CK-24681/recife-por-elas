import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Em dev/preview, encaminha /api pro backend local (em produção quem faz isso é o Nginx).
const proxy = { '/api': 'http://127.0.0.1:3000' };

// Base Alfaia. PWA configurado à mão em public/manifest.webmanifest + public/sw.js
// (registrado em src/main.tsx) — sem depender de plugin externo.
export default defineConfig({
  plugins: [react()],
  server: { proxy },
  preview: { proxy },
  // O build sai em `dist.novo` e só vira `dist` quando terminou inteiro (ver
  // publicar.mjs). O vite APAGA o outDir antes de escrever: apontá-lo direto
  // pra `dist` derrubava a aplicação durante todo o build — e a deixava
  // derrubada PARA SEMPRE quando o build falhava no meio.
  build: { outDir: 'dist.novo', emptyOutDir: true },
  resolve: { dedupe: ['react', 'react-dom'] },
});
