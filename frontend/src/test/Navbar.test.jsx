import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen }  from '@testing-library/react';
import userEvent            from '@testing-library/user-event';
import { MemoryRouter }     from 'react-router-dom';
import Navbar               from '../components/Navbar';

const mockNavigate = vi.hoisted(() => vi.fn());
const mockLogout   = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', async (importActual) => {
  const actual = await importActual();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ logout: mockLogout }),
}));

const renderNavbar = (route = '/') =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <Navbar />
    </MemoryRouter>
  );

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Navbar', () => {
  it('renders the ShotSecure brand name', () => {
    renderNavbar();
    expect(screen.getByText('ShotSecure')).toBeInTheDocument();
  });

  it('renders all navigation links on desktop (matchMedia returns false = not mobile)', () => {
    renderNavbar();
    expect(screen.getByRole('button', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /students/i  })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /drives/i    })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reports/i   })).toBeInTheDocument();
  });

  it('navigates when a nav link is clicked', async () => {
    renderNavbar();
    await userEvent.click(screen.getByRole('button', { name: /students/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/students');
  });

  it('calls logout and navigates to /login when Logout is clicked', async () => {
    renderNavbar();

    // Open the avatar menu
    await userEvent.click(screen.getByRole('button', { name: /account menu/i }));
    // Click Logout in the dropdown
    await userEvent.click(screen.getByRole('menuitem', { name: /logout/i }));

    expect(mockLogout).toHaveBeenCalledOnce();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('shows the logged-in username in the avatar menu', async () => {
    renderNavbar();
    await userEvent.click(screen.getByRole('button', { name: /account menu/i }));
    expect(screen.getByText('admin')).toBeInTheDocument();
  });
});
