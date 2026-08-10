import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns the service status', () => {
    const response = new HealthController().getHealth();

    expect(response.status).toBe('ok');
    expect(response.app).toBe('SIIntranet API');
    expect(Number.isNaN(Date.parse(response.timestamp))).toBe(false);
  });
});
