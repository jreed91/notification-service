import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Dashboard } from '../pages/Dashboard';

describe('Dashboard', () => {
  const renderDashboard = () => {
    return render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
  };

  it('should render dashboard title', () => {
    renderDashboard();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('should render description', () => {
    renderDashboard();
    expect(
      screen.getByText(/Multi-tenant notification service/)
    ).toBeInTheDocument();
  });

  it('should display navigation cards', () => {
    renderDashboard();
    expect(screen.getByText('Templates')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Send')).toBeInTheDocument();
  });

  it('should have correct links', () => {
    renderDashboard();

    const templatesLink = screen.getByRole('link', { name: /templates/i });
    expect(templatesLink).toHaveAttribute('href', '/templates');

    const usersLink = screen.getByRole('link', { name: /users/i });
    expect(usersLink).toHaveAttribute('href', '/users');

    const notificationsLink = screen.getByRole('link', { name: /notifications/i });
    expect(notificationsLink).toHaveAttribute('href', '/notifications');
  });

  it('should display features list', () => {
    renderDashboard();
    expect(screen.getByText(/Multi-channel notifications/)).toBeInTheDocument();
    expect(screen.getByText(/Template-based messages/)).toBeInTheDocument();
    expect(screen.getByText(/Multi-language support/)).toBeInTheDocument();
    expect(screen.getByText(/Subscription management/)).toBeInTheDocument();
    expect(screen.getByText(/Multi-tenant architecture/)).toBeInTheDocument();
  });
});
