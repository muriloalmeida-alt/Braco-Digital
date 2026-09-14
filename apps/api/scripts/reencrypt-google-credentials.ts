/**
 * Reencriptação one-shot de credenciais Google do formato legado
 * (`EnvKeyAesGcmCipher`) para o formato production-grade (`Google
 * CloudKmsCipher`) — issue de KMS production-grade.
 *
 * Nunca roda automaticamente — nenhuma request normal reencripta nada
 * (ver `GoogleCloudKmsCipher.decrypt`: lê o formato legado só para
 * leitura, nunca reescreve). Rode este script manualmente, uma vez por
 * ambiente, depois de migrar `CREDENTIALS_CIPHER_PROVIDER` para
 * `gcp-kms`.
 *
 * Dry-run por padrão — só reporta contagens e IDs técnicos (nunca
 * plaintext, nunca companyId associado a segredo nenhum em texto
 * legível além do próprio ID técnico da linha). Passe `--apply` para
 * gravar de verdade.
 *
 * Requer, no ambiente em que este script roda:
 * - `GOOGLE_CREDENTIALS_ENCRYPTION_KEY` (para LER o formato legado);
 * - `CREDENTIALS_CIPHER_PROVIDER=gcp-kms` + `GCP_KMS_*` (formato de
 *   destino).
 *
 * Uso:
 *   npm run google:reencrypt-credentials            # dry-run
 *   npm run google:reencrypt-credentials -- --apply  # aplica de verdade
 */
import { PrismaClient } from '@prisma/client';
import { createCredentialsCipher, EnvKeyAesGcmCipher } from '../src/integrations/google/credentials-cipher';
import { GCP_KMS_CIPHERTEXT_PREFIX } from '../src/integrations/google/kms/google-cloud-kms-cipher';

function isLegacyFormat(value: string | null): value is string {
  return value !== null && !value.startsWith(GCP_KMS_CIPHERTEXT_PREFIX);
}

async function main() {
  const apply = process.argv.includes('--apply');

  const legacyKey = process.env.GOOGLE_CREDENTIALS_ENCRYPTION_KEY?.trim();
  if (!legacyKey) {
    console.error('GOOGLE_CREDENTIALS_ENCRYPTION_KEY não configurada — necessária para LER o formato legado.');
    process.exit(1);
  }
  const legacyCipher = new EnvKeyAesGcmCipher(legacyKey);

  if (process.env.CREDENTIALS_CIPHER_PROVIDER !== 'gcp-kms') {
    console.error('CREDENTIALS_CIPHER_PROVIDER precisa ser "gcp-kms" neste ambiente para rodar este script (é o formato de destino).');
    process.exit(1);
  }
  const kmsCipher = createCredentialsCipher(process.env);

  const prisma = new PrismaClient();
  try {
    const connections = await prisma.googleConnection.findMany({
      where: { OR: [{ accessTokenEncrypted: { not: null } }, { refreshTokenEncrypted: { not: null } }] },
      select: { id: true, accessTokenEncrypted: true, refreshTokenEncrypted: true },
    });

    const legacyRows = connections.filter((c) => isLegacyFormat(c.accessTokenEncrypted) || isLegacyFormat(c.refreshTokenEncrypted));

    console.log(`GoogleConnection com credencial: ${connections.length}. Em formato legado (env-aes): ${legacyRows.length}.`);

    if (!apply) {
      console.log('Dry-run — nenhuma escrita feita. Rode de novo com --apply para reencriptar de verdade.');
      return;
    }

    let migrated = 0;
    for (const row of legacyRows) {
      const accessTokenEncrypted = isLegacyFormat(row.accessTokenEncrypted)
        ? await kmsCipher.encrypt(await legacyCipher.decrypt(row.accessTokenEncrypted))
        : row.accessTokenEncrypted;
      const refreshTokenEncrypted = isLegacyFormat(row.refreshTokenEncrypted)
        ? await kmsCipher.encrypt(await legacyCipher.decrypt(row.refreshTokenEncrypted))
        : row.refreshTokenEncrypted;

      await prisma.googleConnection.update({ where: { id: row.id }, data: { accessTokenEncrypted, refreshTokenEncrypted } });
      migrated += 1;
      console.log(`Reencriptada GoogleConnection ${row.id}.`);
    }
    console.log(`Concluído: ${migrated} linha(s) reencriptada(s) para o formato gcp-kms.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Falha ao reencriptar credenciais:', err instanceof Error ? err.message : err);
  process.exit(1);
});
