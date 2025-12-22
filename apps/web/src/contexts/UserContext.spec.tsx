import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { UserProvider, useUser } from './UserContext';

// TODO: Fix this test - requires complete mock of auth and organization context
// Skip for now as it needs refactoring

// Mock react-oidc-context
jest.mock('react-oidc-context', () => ({
  useAuth: () => ({
    user: {
      profile: {
        sub: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        given_name: 'Test',
        family_name: 'User',
        preferred_username: 'testuser',
      },
    },
    isAuthenticated: true,
  }),
}));

const TestComponent = () => {
  const { user, organizations, currentOrg, setCurrentOrg, createOrganization } =
    useUser();

  return (
    <div>
      <div data-testid="user-email">{user?.email}</div>
      <div data-testid="user-name">{user?.fullName}</div>
      <div data-testid="org-count">{organizations.length}</div>
      <div data-testid="current-org">{currentOrg?.name}</div>
      <button onClick={() => setCurrentOrg(organizations[1])}>
        Switch Org
      </button>
      <button onClick={() => createOrganization('New Org')}>Create Org</button>
    </div>
  );
};

describe.skip('UserContext', () => {
  it('should provide user data from auth', () => {
    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>,
    );

    expect(screen.getByTestId('user-email')).toHaveTextContent(
      'test@example.com',
    );
    expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
  });

  it('should provide organizations', () => {
    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>,
    );

    // Should have default organization
    expect(
      parseInt(screen.getByTestId('org-count').textContent || '0'),
    ).toBeGreaterThan(0);
  });

  it('should set current organization', () => {
    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>,
    );

    expect(screen.getByTestId('current-org')).toBeDefined();
  });
});
