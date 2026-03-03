import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen }  from '@testing-library/react';
import userEvent            from '@testing-library/user-event';
import { MemoryRouter }     from 'react-router-dom';
import Login                from '../pages/Login';

// Hoist mock functions before module imports so vi.mock factories can reference them
const mockNavigate = vi.hoisted(() => vi.fn());
const mockLogin    = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', async (importActual) => {
  const actual = await importActual();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

const renderLogin = () =>
  render(<MemoryRouter><Login /></MemoryRouter>);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Login page', () => {
  it('renders the brand name, username field, password field, and submit button', () => {
    renderLogin();
    expect(screen.getByText('ShotSecure')).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows an error alert when login returns false', async () => {
    mockLogin.mockReturnValue(false);
    renderLogin();

    await userEvent.type(screen.getByLabelText(/username/i), 'admin');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('calls login with entered credentials', async () => {
    mockLogin.mockReturnValue(true);
    renderLogin();

    await userEvent.type(screen.getByLabelText(/username/i), 'admin');
    await userEvent.type(screen.getByLabelText(/password/i), 'password');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(mockLogin).toHaveBeenCalledWith('admin', 'password');
  });

  it('navigates to / on successful login', async () => {
    mockLogin.mockReturnValue(true);
    renderLogin();

    await userEvent.type(screen.getByLabelText(/username/i), 'admin');
    await userEvent.type(screen.getByLabelText(/password/i), 'password');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('does not show an error alert on initial render', () => {
    renderLogin();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
