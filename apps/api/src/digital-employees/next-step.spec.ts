import { resolveNextStep } from './next-step';

describe('resolveNextStep (US05)', () => {
  it('mapeia Contratado para o CTA de preparar funcionário', () => {
    expect(resolveNextStep('CONTRATADO')).toEqual({
      label: 'Preparar funcionário',
      action: 'start_preparation',
    });
  });

  it('mapeia Preparando para o mesmo CTA (único mapeamento necessário na Sprint 01)', () => {
    expect(resolveNextStep('PREPARANDO')).toEqual({
      label: 'Preparar funcionário',
      action: 'start_preparation',
    });
  });

  it.each(['PRONTO', 'TRABALHANDO', 'PAUSADO', 'PRECISA_DE_ATENCAO', 'DESATIVADO'] as const)(
    'não define CTA para %s ainda (fica para sprints futuras)',
    (status) => {
      expect(resolveNextStep(status)).toBeNull();
    },
  );
});
