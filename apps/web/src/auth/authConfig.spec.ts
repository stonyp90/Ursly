describe('authConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should have required OIDC configuration fields', async () => {
    // Import dynamically to allow env override
    const { oidcConfig } = await import('./authConfig');

    expect(oidcConfig).toBeDefined();
    expect(oidcConfig.authority).toBeDefined();
    expect(oidcConfig.client_id).toBeDefined();
    expect(oidcConfig.redirect_uri).toBeDefined();
    expect(oidcConfig.response_type).toBe('code');
    expect(oidcConfig.scope).toContain('openid');
  });

  it('should have silent renew configuration', async () => {
    const { oidcConfig } = await import('./authConfig');

    expect(oidcConfig.automaticSilentRenew).toBe(true);
    expect(oidcConfig.silent_redirect_uri).toBeDefined();
  });

  it('should include profile and email in scope', async () => {
    const { oidcConfig } = await import('./authConfig');

    expect(oidcConfig.scope).toContain('profile');
    expect(oidcConfig.scope).toContain('email');
  });
});

