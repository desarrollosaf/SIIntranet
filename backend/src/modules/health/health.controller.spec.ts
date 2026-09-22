import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns the health status', () => {
    expect(new HealthController().check()).toEqual({ status: 'ok' });
  });
});
