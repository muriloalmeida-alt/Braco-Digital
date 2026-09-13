import { assertZernioEnvValid, getZernioConfig, hasZernioApiKey, isZernioFullyConfigured } from './zernio-config';

const FULL_ENV = {
  ZERNIO_API_KEY: 'sk_test_123',
  ZERNIO_WEBHOOK_SECRET: 'whsec_123',
  ZERNIO_REDIRECT_URL: 'https://api.example.com/integrations/zernio/whatsapp/callback',
};

describe('zernio-config', () => {
  describe('hasZernioApiKey / isZernioFullyConfigured', () => {
    it('desabilitado quando nenhuma variável está presente', () => {
      expect(hasZernioApiKey({})).toBe(false);
      expect(isZernioFullyConfigured({})).toBe(false);
    });

    it('parcialmente configurado (só a key) não conta como totalmente configurado', () => {
      const env = { ZERNIO_API_KEY: 'sk_test' };
      expect(hasZernioApiKey(env)).toBe(true);
      expect(isZernioFullyConfigured(env)).toBe(false);
    });

    it('totalmente configurado com as três variáveis obrigatórias', () => {
      expect(isZernioFullyConfigured(FULL_ENV)).toBe(true);
    });
  });

  describe('assertZernioEnvValid', () => {
    // `assertZernioEnvValid` decide "é produção?" via `isProductionEnvironment()`
    // (docs/technical/17-technical-decisions.md TD19) — a mesma fonte de
    // verdade usada pelo guard de produção do Track A — que lê
    // `process.env.NODE_ENV` global, não o `env` passado para checar as
    // variáveis do Zernio. Por isso o `NODE_ENV` real precisa ser mutado
    // aqui (sempre restaurado), como já é feito nos testes de TD19.
    const originalNodeEnv = process.env.NODE_ENV;
    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('nunca lança fora de produção, mesmo com configuração parcial', () => {
      process.env.NODE_ENV = 'development';
      expect(() => assertZernioEnvValid({ ZERNIO_API_KEY: 'sk_test' })).not.toThrow();
      process.env.NODE_ENV = 'test';
      expect(() => assertZernioEnvValid({ ZERNIO_API_KEY: 'sk_test' })).not.toThrow();
    });

    it('não lança em produção quando a integração está totalmente desabilitada (nenhuma variável)', () => {
      process.env.NODE_ENV = 'production';
      expect(() => assertZernioEnvValid({})).not.toThrow();
    });

    it('lança em produção quando a API key está presente mas falta alguma variável obrigatória', () => {
      process.env.NODE_ENV = 'production';
      expect(() => assertZernioEnvValid({ ZERNIO_API_KEY: 'sk_test' })).toThrow(/ZERNIO_WEBHOOK_SECRET/);
    });

    it('não lança em produção quando totalmente configurado', () => {
      process.env.NODE_ENV = 'production';
      expect(() => assertZernioEnvValid(FULL_ENV)).not.toThrow();
    });
  });

  describe('getZernioConfig', () => {
    it('lança se chamada sem configuração completa', () => {
      expect(() => getZernioConfig({})).toThrow();
      expect(() => getZernioConfig({ ZERNIO_API_KEY: 'sk_test' })).toThrow();
    });

    it('usa o base URL default e normaliza barra final quando ZERNIO_BASE_URL não é definido', () => {
      const config = getZernioConfig(FULL_ENV);
      expect(config.baseUrl).toBe('https://zernio.com/api/v1');
    });

    it('permite sobrescrever o base URL (para testes apontarem para um servidor local)', () => {
      const config = getZernioConfig({ ...FULL_ENV, ZERNIO_BASE_URL: 'http://localhost:9999/v1/' });
      expect(config.baseUrl).toBe('http://localhost:9999/v1');
    });

    it('nunca inclui a API key em outro campo além de `apiKey`', () => {
      const config = getZernioConfig(FULL_ENV);
      expect(config.apiKey).toBe('sk_test_123');
      expect(JSON.stringify(config)).not.toContain('undefined');
    });
  });
});
