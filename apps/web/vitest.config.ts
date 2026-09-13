import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/**
 * Primeira infraestrutura de testes automatizados do frontend (issue #28)
 * — até aqui a validação era só manual/Playwright. Config separada de
 * `vite.config.ts` (que não precisa saber de testes) para manter o build
 * de produção livre de qualquer configuração de teste.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    css: false,
  },
});
