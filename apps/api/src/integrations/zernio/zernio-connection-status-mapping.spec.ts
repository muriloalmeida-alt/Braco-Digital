import { IntegrationStatus, ZernioConnectionStatus } from '@prisma/client';
import { toIntegrationStatus } from './zernio-connection.service';

/**
 * `ResourcesService`/`PreparationReadinessService` (Track A, TD19) só
 * conhecem `IntegrationStatus` — este mapeamento é o único lugar que
 * traduz o estado detalhado do Zernio para o que essas classes já leem.
 */
describe('toIntegrationStatus', () => {
  it.each([
    [ZernioConnectionStatus.NOT_CONNECTED, IntegrationStatus.NOT_CONFIGURED],
    [ZernioConnectionStatus.CONNECTING, IntegrationStatus.CONNECTING],
    [ZernioConnectionStatus.CONNECTED, IntegrationStatus.CONNECTED],
    [ZernioConnectionStatus.DEGRADED, IntegrationStatus.NEEDS_ATTENTION],
    [ZernioConnectionStatus.FAILED, IntegrationStatus.NEEDS_ATTENTION],
    [ZernioConnectionStatus.DISCONNECTED, IntegrationStatus.DISCONNECTED],
  ])('%s -> %s', (zernioStatus, expected) => {
    expect(toIntegrationStatus(zernioStatus)).toBe(expected);
  });
});
