import { assertCredentialsCipherEnvValid, getCredentialsCipherProvider, getGcpKmsConfig, isGcpKmsFullyConfigured } from './gcp-kms-config';

const FULL_ENV = {
  GCP_KMS_KEY_NAME: 'projects/p/locations/l/keyRings/r/cryptoKeys/k',
  GCP_KMS_CLIENT_EMAIL: 'braco-kms@p.iam.gserviceaccount.com',
  GCP_KMS_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\\nMIIB...\\n-----END PRIVATE KEY-----\\n',
};

describe('gcp-kms-config', () => {
  describe('getCredentialsCipherProvider', () => {
    it('default é "env" — nunca muda o comportamento de quem não define a variável', () => {
      expect(getCredentialsCipherProvider({})).toBe('env');
    });

    it('só reconhece "gcp-kms" explicitamente — qualquer outro valor cai no default seguro', () => {
      expect(getCredentialsCipherProvider({ CREDENTIALS_CIPHER_PROVIDER: 'gcp-kms' })).toBe('gcp-kms');
      expect(getCredentialsCipherProvider({ CREDENTIALS_CIPHER_PROVIDER: 'GCP-KMS' })).toBe('gcp-kms');
      expect(getCredentialsCipherProvider({ CREDENTIALS_CIPHER_PROVIDER: 'algo-invalido' })).toBe('env');
    });
  });

  describe('isGcpKmsFullyConfigured / getGcpKmsConfig', () => {
    it('desabilitado sem nenhuma variável', () => {
      expect(isGcpKmsFullyConfigured({})).toBe(false);
      expect(() => getGcpKmsConfig({})).toThrow();
    });

    it('parcialmente configurado não conta como totalmente configurado', () => {
      expect(isGcpKmsFullyConfigured({ GCP_KMS_KEY_NAME: 'x' })).toBe(false);
    });

    it('totalmente configurado, decodifica \\n literal da chave privada', () => {
      const config = getGcpKmsConfig(FULL_ENV);
      expect(config.keyName).toBe(FULL_ENV.GCP_KMS_KEY_NAME);
      expect(config.privateKey).toContain('\n');
      expect(config.privateKey).not.toContain('\\n');
    });

    it('usa defaults de token/API/timeout quando não sobrescritos', () => {
      const config = getGcpKmsConfig(FULL_ENV);
      expect(config.tokenUri).toBe('https://oauth2.googleapis.com/token');
      expect(config.apiBase).toBe('https://cloudkms.googleapis.com/v1');
      expect(config.requestTimeoutMs).toBe(10_000);
    });
  });

  describe('assertCredentialsCipherEnvValid — fail-closed', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('nunca lança fora de produção, mesmo com Google habilitado e provider env', () => {
      process.env.NODE_ENV = 'development';
      expect(() => assertCredentialsCipherEnvValid({}, true)).not.toThrow();
    });

    it('nunca lança em produção se Google não está habilitado', () => {
      process.env.NODE_ENV = 'production';
      expect(() => assertCredentialsCipherEnvValid({}, false)).not.toThrow();
    });

    it('lança em produção com Google habilitado e provider "env" (default) — nunca fallback silencioso', () => {
      process.env.NODE_ENV = 'production';
      expect(() => assertCredentialsCipherEnvValid({}, true)).toThrow(/gcp-kms/);
    });

    it('lança em produção com provider "gcp-kms" mas configuração incompleta', () => {
      process.env.NODE_ENV = 'production';
      expect(() => assertCredentialsCipherEnvValid({ CREDENTIALS_CIPHER_PROVIDER: 'gcp-kms' }, true)).toThrow(/GCP_KMS_KEY_NAME/);
    });

    it('não lança em produção com Google habilitado e "gcp-kms" totalmente configurado', () => {
      process.env.NODE_ENV = 'production';
      expect(() => assertCredentialsCipherEnvValid({ CREDENTIALS_CIPHER_PROVIDER: 'gcp-kms', ...FULL_ENV }, true)).not.toThrow();
    });
  });
});
