import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Configuração do Vitest para a suíte de testes da API.
// - Alias '@' -> 'src' (mesmo do tsconfig.json)
// - Environment node (route handlers não precisam de DOM)
// - Testes localizados em src/__tests__/**/*.test.ts
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
