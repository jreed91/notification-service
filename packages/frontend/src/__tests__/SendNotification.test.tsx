import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SendNotification from '../pages/SendNotification';

describe('SendNotification', () => {
  const renderSendNotification = () => {
    return render(
      <BrowserRouter>
        <SendNotification />
      </BrowserRouter>
    );
  };

  it('should render send notification page title', () => {
    renderSendNotification();
    expect(screen.getByText('Send Notification')).toBeInTheDocument();
  });

  it('should render description text', () => {
    renderSendNotification();
    expect(screen.getByText(/Send a notification to a user/)).toBeInTheDocument();
  });

  it('should display coming soon message', () => {
    renderSendNotification();
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
  });

  it('should have back to notifications link', () => {
    renderSendNotification();
    expect(screen.getByRole('link', { name: /back to notifications/i })).toBeInTheDocument();
  });

  it('should render send icon', () => {
    renderSendNotification();
    // Check for the SVG element (lucide-react renders SVGs)
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
