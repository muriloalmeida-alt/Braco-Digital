import { getPublicLeadCaptureMode } from './public-launch-gate';

describe('getPublicLeadCaptureMode', () => {
  const original = process.env.PUBLIC_LEAD_CAPTURE_MODE;

  afterEach(() => {
    if (original === undefined) delete process.env.PUBLIC_LEAD_CAPTURE_MODE;
    else process.env.PUBLIC_LEAD_CAPTURE_MODE = original;
  });

  it('fail-closed: variável ausente → DISABLED', () => {
    delete process.env.PUBLIC_LEAD_CAPTURE_MODE;
    expect(getPublicLeadCaptureMode()).toBe('DISABLED');
  });

  it('fail-closed: valor vazio → DISABLED', () => {
    process.env.PUBLIC_LEAD_CAPTURE_MODE = '';
    expect(getPublicLeadCaptureMode()).toBe('DISABLED');
  });

  it('fail-closed: valor não reconhecido → DISABLED (nunca SYNTHETIC/REAL por acidente)', () => {
    process.env.PUBLIC_LEAD_CAPTURE_MODE = 'yes-please';
    expect(getPublicLeadCaptureMode()).toBe('DISABLED');
  });

  it('reconhece SYNTHETIC (e o sinônimo TEST)', () => {
    process.env.PUBLIC_LEAD_CAPTURE_MODE = 'SYNTHETIC';
    expect(getPublicLeadCaptureMode()).toBe('SYNTHETIC');
    process.env.PUBLIC_LEAD_CAPTURE_MODE = 'test';
    expect(getPublicLeadCaptureMode()).toBe('SYNTHETIC');
  });

  it('reconhece REAL só quando explicitamente setado', () => {
    process.env.PUBLIC_LEAD_CAPTURE_MODE = 'REAL';
    expect(getPublicLeadCaptureMode()).toBe('REAL');
  });

  it('é case-insensitive e tolera espaços', () => {
    process.env.PUBLIC_LEAD_CAPTURE_MODE = '  real  ';
    expect(getPublicLeadCaptureMode()).toBe('REAL');
  });
});
