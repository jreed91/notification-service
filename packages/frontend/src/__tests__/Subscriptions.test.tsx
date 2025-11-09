import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Subscriptions from '../pages/Subscriptions';

describe('Subscriptions', () => {
  const renderSubscriptions = () => {
    return render(
      <BrowserRouter>
        <Subscriptions />
      </BrowserRouter>
    );
  };

  it('should render subscriptions page title', () => {
    renderSubscriptions();
    expect(screen.getByText('User Subscriptions')).toBeInTheDocument();
  });

  it('should render description text', () => {
    renderSubscriptions();
    expect(screen.getByText(/Manage user subscription preferences/)).toBeInTheDocument();
  });

  it('should display coming soon message', () => {
    renderSubscriptions();
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
  });

  it('should render bell icon', () => {
    renderSubscriptions();
    // Check for the SVG element (lucide-react renders SVGs)
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
