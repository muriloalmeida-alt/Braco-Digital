import { assertGoogleEnvValid, getGoogleOAuthConfig, hasGoogleClientId, isGoogleFullyConfigured } from './google-config';

const FULL_ENV = {
  GOOGLE_CLIENT_ID: 'client-id-123.apps.googleusercontent.com',
  GOOGLE_CLIENT_SECRET: 'secret-123',
  GOOGLE_REDIRECT_URI: 'https://api.example.com/integrations/google/callback',
  GOOGLE_CREDENTIALS_ENCRYPTION_KEY: 'a-base64-key',
};

describe('google-config', () => {
  describe('hasGoogleClientId / isGoogleFullyConfigured', () => {
    it('desabilitado quando nenhuma variável está presente', () => {
      expect(hasGoogleClientId({})).toBe(false);
      expect(isGoogleFullyConfigured({})).toBe(false);
    });

    it('parcialmente configurado (só o client id) não conta como totalmente configurado', () => {
      const env = { GOOGLE_CLIENT_ID: 'client-id' };
      expect(hasGoogleClientId(env)).toBe(true);
      expect(isGoogleFullyConfigured(env)).toBe(false);
    });

    it('totalmente configurado com as quatro variáveis obrigatórias', () => {
      expect(isGoogleFullyConfigured(FULL_ENV)).toBe(true);
    });
  });

  describe('assertGoogleEnvValid', () => {
    // Mesma observação de zernio-config.spec.ts: `isProductionEnvironment()`
    // lê `process.env.NODE_ENV` global, não o `env` passado aqui.
    const originalNodeEnv = process.env.NODE_ENV;
    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('nunca lança fora de produção, mesmo com configuração parcial', () => {
      process.env.NODE_ENV = 'development';
      expect(() => assertGoogleEnvValid({ GOOGLE_CLIENT_ID: 'client-id' })).not.toThrow();
      process.env.NODE_ENV = 'test';
      expect(() => assertGoogleEnvValid({ GOOGLE_CLIENT_ID: 'client-id' })).not.toThrow();
    });

    it('não lança em produção quando a integração está totalmente desabilitada (nenhuma variável)', () => {
      process.env.NODE_ENV = 'production';
      expect(() => assertGoogleEnvValid({})).not.toThrow();
    });

    it('lança em produção quando o client id está presente mas falta alguma variável obrigatória', () => {
      process.env.NODE_ENV = 'production';
      expect(() => assertGoogleEnvValid({ GOOGLE_CLIENT_ID: 'client-id' })).toThrow(/GOOGLE_CLIENT_SECRET/);
    });

    it('exige GOOGLE_CREDENTIALS_ENCRYPTION_KEY especificamente (nunca token OAuth em texto plano)', () => {
      process.env.NODE_ENV = 'production';
      const { GOOGLE_CREDENTIALS_ENCRYPTION_KEY, ...withoutKey } = FULL_ENV;
      void GOOGLE_CREDENTIALS_ENCRYPTION_KEY;
      expect(() => assertGoogleEnvValid(withoutKey)).toThrow(/GOOGLE_CREDENTIALS_ENCRYPTION_KEY/);
    });

    it('não lança em produção quando totalmente configurado', () => {
      process.env.NODE_ENV = 'production';
      expect(() => assertGoogleEnvValid(FULL_ENV)).not.toThrow();
    });
  });

  describe('getGoogleOAuthConfig', () => {
    it('lança se chamada sem configuração completa', () => {
      expect(() => getGoogleOAuthConfig({})).toThrow();
      expect(() => getGoogleOAuthConfig({ GOOGLE_CLIENT_ID: 'client-id' })).toThrow();
    });

    it('usa o timeout default quando GOOGLE_REQUEST_TIMEOUT_MS não é definido', () => {
      const config = getGoogleOAuthConfig(FULL_ENV);
      expect(config.requestTimeoutMs).toBe(10_000);
    });

    it('permite sobrescrever o timeout', () => {
      const config = getGoogleOAuthConfig({ ...FULL_ENV, GOOGLE_REQUEST_TIMEOUT_MS: '5000' });
      expect(config.requestTimeoutMs).toBe(5000);
    });

    it('nunca inclui client_secret em outro campo além de `clientSecret`', () => {
      const config = getGoogleOAuthConfig(FULL_ENV);
      expect(config.clientSecret).toBe('secret-123');
      expect(JSON.stringify(config)).not.toContain('undefined');
    });
  });
});
