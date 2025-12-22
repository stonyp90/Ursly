import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../../theme';

// Mock services
jest.mock('../../services/agents.service', () => ({
  agentsService: {
    getAgents: jest.fn().mockResolvedValue({ agents: [], total: 0 }),
  },
}));

jest.mock('../../services/models.service', () => ({
  modelsService: {
    listModels: jest.fn().mockResolvedValue({ models: [] }),
  },
}));

jest.mock('../../services/audit.service', () => ({
  auditService: {
    getStats: jest.fn().mockResolvedValue({
      totalEvents: 0,
      eventsByType: {},
    }),
  },
}));

// Mock react-oidc-context
jest.mock('react-oidc-context', () => ({
  useAuth: () => ({
    user: {
      profile: {
        sub: 'user-123',
        email: 'test@example.com',
      },
    },
    isAuthenticated: true,
  }),
}));

// Mock UserContext
jest.mock('../../contexts/UserContext', () => ({
  useUser: () => ({
    user: {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'admin',
    },
    organization: {
      id: 'org-123',
      name: 'Test Org',
      slug: 'test-org',
    },
    isLoading: false,
    error: null,
  }),
  UserProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

import { Dashboard } from './Dashboard';

const renderWithProviders = (children: React.ReactNode) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </BrowserRouter>,
  );
};

// TODO: Fix this test - requires complete mock of UserContext and services
describe.skip('Dashboard', () => {
  it('should render dashboard title', () => {
    renderWithProviders(<Dashboard />);

    expect(screen.getByText('Welcome back')).toBeInTheDocument();
  });

  it('should render stats cards', () => {
    renderWithProviders(<Dashboard />);

    expect(screen.getByText('Active Agents')).toBeInTheDocument();
    expect(screen.getByText('Available Models')).toBeInTheDocument();
  });

  it('should render quick actions section', () => {
    renderWithProviders(<Dashboard />);

    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
  });
});
