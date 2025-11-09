import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Login } from '../pages/Login';

// Mock the useNavigate hook
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock the auth store
vi.mock('../stores/authStore', () => ({
  useAuthStore: () => ({
    setApiKey: vi.fn(),
  }),
}));

describe('Login Page', () => {
  it('should render login form', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    expect(screen.getByText('Notification Service')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your API key')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should have an input field for API key', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const input = screen.getByPlaceholderText('Enter your API key');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
  });

  it('should update input value when typing', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const input = screen.getByPlaceholderText('Enter your API key') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'test-api-key' } });

    expect(input.value).toBe('test-api-key');
  });
});
