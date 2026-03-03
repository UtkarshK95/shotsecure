import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent           from '@testing-library/user-event';
import { MemoryRouter }    from 'react-router-dom';
import Reports             from '../pages/Reports';
import api                 from '../api/axios';

vi.mock('../api/axios', () => ({
  default: { get: vi.fn() },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true }),
}));

const MOCK_DRIVES = [
  { _id: 'd1', vaccineName: 'Hepatitis B', date: '2026-01-15', location: 'Main Hall' },
  { _id: 'd2', vaccineName: 'Polio (OPV)', date: '2026-02-20', location: 'Gymnasium' },
];

const MOCK_ROWS = [
  { studentId: 'S001', name: 'Aarav Sharma', class: '10A', vaccinated: 'Yes', vaccineName: 'Hepatitis B', date: '2026-01-15', location: 'Main Hall' },
  { studentId: 'S002', name: 'Priya Verma',  class: '9A',  vaccinated: 'No',  vaccineName: '',            date: '',           location: ''           },
];

beforeEach(() => {
  vi.clearAllMocks();
  api.get.mockImplementation((url) => {
    if (url === '/drives')  return Promise.resolve({ data: MOCK_DRIVES });
    if (url === '/reports') return Promise.resolve({ data: MOCK_ROWS });
    return Promise.resolve({ data: [] });
  });
});

const renderReports = () =>
  render(<MemoryRouter><Reports /></MemoryRouter>);

describe('Reports page — initial render', () => {
  it('renders the page heading', async () => {
    renderReports();
    expect(await screen.findByText('Vaccination Reports')).toBeInTheDocument();
  });

  it('renders report rows after load', async () => {
    renderReports();
    expect(await screen.findByText('Aarav Sharma')).toBeInTheDocument();
    expect(screen.getByText('Priya Verma')).toBeInTheDocument();
  });

  it('shows "Yes" and "No" status chips', async () => {
    renderReports();
    await screen.findByText('Aarav Sharma');
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  it('shows vaccine name and location for vaccinated rows', async () => {
    renderReports();
    await screen.findByText('Aarav Sharma');
    expect(screen.getByText('Hepatitis B')).toBeInTheDocument();
    expect(screen.getByText('Main Hall')).toBeInTheDocument();
  });

  it('shows "No records found" when the report is empty', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/drives')  return Promise.resolve({ data: MOCK_DRIVES });
      if (url === '/reports') return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });
    renderReports();
    expect(await screen.findByText(/no records found/i)).toBeInTheDocument();
  });
});

describe('Reports page — filter controls', () => {
  it('renders the Apply Filters and Clear buttons', async () => {
    renderReports();
    await screen.findByText('Aarav Sharma');
    expect(screen.getByRole('button', { name: /apply filters/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clear/i         })).toBeInTheDocument();
  });

  it('calls GET /reports when Apply Filters is clicked', async () => {
    renderReports();
    await screen.findByText('Aarav Sharma');

    const callCountBefore = api.get.mock.calls.filter((c) => c[0] === '/reports').length;
    await userEvent.click(screen.getByRole('button', { name: /apply filters/i }));
    const callCountAfter = api.get.mock.calls.filter((c) => c[0] === '/reports').length;

    expect(callCountAfter).toBeGreaterThan(callCountBefore);
  });

  it('re-fetches with no params when Clear is clicked', async () => {
    renderReports();
    await screen.findByText('Aarav Sharma');

    await userEvent.click(screen.getByRole('button', { name: /clear/i }));

    const reportCalls = api.get.mock.calls.filter((c) => c[0] === '/reports');
    const lastCall = reportCalls[reportCalls.length - 1];
    // Clear should pass an empty params object
    expect(lastCall[1]?.params).toEqual({});
  });
});

describe('Reports page — Export CSV button', () => {
  it('renders the Export CSV button', async () => {
    renderReports();
    await screen.findByText('Aarav Sharma');
    expect(screen.getByRole('button', { name: /export csv/i })).toBeInTheDocument();
  });

  it('Export CSV button is enabled when rows are present', async () => {
    renderReports();
    await screen.findByText('Aarav Sharma');
    expect(screen.getByRole('button', { name: /export csv/i })).not.toBeDisabled();
  });

  it('Export CSV button is disabled when no rows are present', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/drives')  return Promise.resolve({ data: MOCK_DRIVES });
      if (url === '/reports') return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });
    renderReports();
    await screen.findByText(/no records found/i);
    expect(screen.getByRole('button', { name: /export csv/i })).toBeDisabled();
  });
});
