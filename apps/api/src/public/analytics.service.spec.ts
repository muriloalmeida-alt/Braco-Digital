import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  it('descarta propriedades fora da allowlist do evento (nunca PII)', () => {
    const service = new AnalyticsService();
    const logSpy = jest.spyOn((service as unknown as { logger: { log: (msg: string) => void } }).logger, 'log');

    service.track({
      event: 'lead_submit_error',
      sessionId: '11111111-1111-4111-8111-111111111111',
      eventId: '22222222-2222-4222-8222-222222222222',
      properties: { reason: 'validation_error', whatsapp: '+5511999998888', name: 'João' },
    });

    const logged = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(logged.properties).toEqual({ reason: 'validation_error' });
    expect(logged.properties.whatsapp).toBeUndefined();
    expect(logged.properties.name).toBeUndefined();
  });

  it('ignora reentrega do mesmo eventId (dedup)', () => {
    const service = new AnalyticsService();
    const first = service.track({
      event: 'landing_view',
      sessionId: '11111111-1111-4111-8111-111111111111',
      eventId: '33333333-3333-4333-8333-333333333333',
    });
    const second = service.track({
      event: 'landing_view',
      sessionId: '11111111-1111-4111-8111-111111111111',
      eventId: '33333333-3333-4333-8333-333333333333',
    });
    expect(first.deduped).toBe(false);
    expect(second.deduped).toBe(true);
  });
});
