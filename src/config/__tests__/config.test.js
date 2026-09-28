import { describe, it, expect } from 'vitest';

describe('offline env flag (canonical VITE_ENABLE_OFFLINE_MODE)', () => {
  it('accepts canonical or legacy flag', () => {
    const isOffline = (env) =>
      env.VITE_ENABLE_OFFLINE_MODE === 'true' || env.VITE_ENABLE_OFFLINE === 'true';

    expect(isOffline({ VITE_ENABLE_OFFLINE_MODE: 'true' })).toBe(true);
    expect(isOffline({ VITE_ENABLE_OFFLINE: 'true' })).toBe(true);
    expect(isOffline({})).toBe(false);
    expect(isOffline({ VITE_ENABLE_OFFLINE_MODE: 'false' })).toBe(false);
  });
});
