import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { consumeIntegrationReturnPath, rememberIntegrationReturnPath } from './integrations';

/**
 * UI real de Recursos — "sem open redirect": o return path guardado
 * antes do redirect para o provedor externo só pode ser um caminho
 * relativo same-origin, nunca uma URL absoluta (que poderia apontar para
 * fora do BRAÇO se alguém conseguisse manipular o valor gravado).
 */
describe('integrations — return path do callback', () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => sessionStorage.clear());

  it('guarda e devolve um caminho relativo same-origin', () => {
    rememberIntegrationReturnPath('/equipe/e1/preparar?etapa=recursos_trabalho');
    expect(consumeIntegrationReturnPath()).toBe('/equipe/e1/preparar?etapa=recursos_trabalho');
  });

  it('consumir apaga o valor — uma segunda leitura cai no fallback', () => {
    rememberIntegrationReturnPath('/equipe/e1/preparar');
    consumeIntegrationReturnPath();
    expect(consumeIntegrationReturnPath('/equipe')).toBe('/equipe');
  });

  it('nunca aceita uma URL absoluta (proteção contra open redirect)', () => {
    rememberIntegrationReturnPath('https://evil.example/phish');
    expect(consumeIntegrationReturnPath('/equipe')).toBe('/equipe');
  });

  it('sem nada guardado, devolve o fallback informado', () => {
    expect(consumeIntegrationReturnPath('/equipe')).toBe('/equipe');
  });
});
