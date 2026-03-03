import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen }  from '@testing-library/react';
import { MemoryRouter }     from 'react-router-dom';
import Dashboard            from '../pages/Dashboard';
import api                  from '../api/axios';

vi.mock('../api/axios', () => ({
  default: { get: vi.fn() },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true }),
}));

// 3 students: 2 vaccinated, 1 not
const MOCK_STUDENTS = [
  { _id: '1', studentId: 'S001', name: 'Aarav', class: '10A', vaccinations: [{ vaccineName: 'HepB' }] },
  { _id: '2', studentId: 'S002', name: 'Priya', class: '9A',  vaccinations: [{ vaccineName: 'Polio' }] },
  { _id: '3', studentId: 'S003', name: 'Rohan', class: '8B',  vaccinations: [] },
];

// 2 drives: 1 past, 1 future (upcoming)
const MOCK_DRIVES = [
  { _id: 'd1', vaccineName: 'HepB',  date: '2026-01-15', location: 'Main Hall' },
  { _id: 'd2', vaccineName: 'MMR',   date: '2099-01-01', location: 'Gymnasium' },
];

beforeEach(() => {
  vi.clearAllMocks();
  api.get.mockImplementation((url) => {
    if (url === '/students') return Promise.resolve({ data: MOCK_STUDENTS });
    if (url === '/drives')   return Promise.resolve({ data: MOCK_DRIVES });
    return Promise.resolve({ data: [] });
  });
});

const renderDashboard = () =>
  render(<MemoryRouter><Dashboard /></MemoryRouter>);

describe('Dashboard', () => {
  it('shows a loading spinner before data arrives', () => {
    // Make the API hang so we catch the loading state
    api.get.mockReturnValue(new Promise(() => {}));
    renderDashboard();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays total student count', async () => {
    renderDashboard();
    expect(await screen.findByText('3')).toBeInTheDocument();
  });

  it('displays vaccinated student count', async () => {
    renderDashboard();
    // 2 students have vaccinations
    const cells = await screen.findAllByText('2');
    expect(cells.length).toBeGreaterThanOrEqual(1);
  });

  it('displays unvaccinated student count', async () => {
    renderDashboard();
    // 1 student has no vaccinations
    const cells = await screen.findAllByText('1');
    expect(cells.length).toBeGreaterThanOrEqual(1);
  });

  it('renders all four stat card labels', async () => {
    renderDashboard();
    expect(await screen.findByText('Total Students')).toBeInTheDocument();
    expect(screen.getByText('Vaccinated')).toBeInTheDocument();       // exact — won't match "Not Vaccinated"
    expect(screen.getByText('Not Vaccinated')).toBeInTheDocument();
    expect(screen.getByText('Upcoming Drives')).toBeInTheDocument();
  });
});
