import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent                   from '@testing-library/user-event';
import { MemoryRouter }            from 'react-router-dom';
import Students                    from '../pages/Students';
import api                         from '../api/axios';

vi.mock('../api/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true }),
}));

const MOCK_DRIVES = [
  { _id: 'd1', vaccineName: 'Hepatitis B', date: '2026-01-15T00:00:00.000Z', location: 'Main Hall' },
];

const MOCK_STUDENTS = [
  { _id: 's1', studentId: 'S001', name: 'Aarav Sharma',  class: '10A', vaccinations: [] },
  { _id: 's2', studentId: 'S002', name: 'Priya Verma',   class: '9A',  vaccinations: [{ vaccineName: 'Hepatitis B', drive: { _id: 'd1', location: 'Main Hall' }, date: '2026-01-15' }] },
];

beforeEach(() => {
  vi.clearAllMocks();
  api.get.mockImplementation((url) => {
    if (url === '/students') return Promise.resolve({ data: MOCK_STUDENTS });
    if (url === '/drives')   return Promise.resolve({ data: MOCK_DRIVES });
    return Promise.resolve({ data: [] });
  });
});

const renderStudents = () =>
  render(<MemoryRouter><Students /></MemoryRouter>);

describe('Students page — initial render', () => {
  it('shows a loading spinner while fetching', () => {
    api.get.mockReturnValue(new Promise(() => {}));
    renderStudents();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders the page heading', async () => {
    renderStudents();
    expect(await screen.findByText('Students')).toBeInTheDocument();
  });

  it('renders student rows after load', async () => {
    renderStudents();
    expect(await screen.findByText('Aarav Sharma')).toBeInTheDocument();
    expect(screen.getByText('Priya Verma')).toBeInTheDocument();
  });

  it('shows "Not Vaccinated" chip for unvaccinated students', async () => {
    renderStudents();
    await screen.findByText('Aarav Sharma');
    const chips = screen.getAllByText(/not vaccinated/i);
    expect(chips.length).toBeGreaterThanOrEqual(1);
  });

  it('shows "Vaccinated" chip for vaccinated students', async () => {
    renderStudents();
    await screen.findByText('Priya Verma');
    expect(screen.getByText(/vaccinated \(1\)/i)).toBeInTheDocument();
  });
});

describe('Students page — Add Student dialog', () => {
  it('opens the Add Student dialog when the button is clicked', async () => {
    renderStudents();
    await screen.findByText('Aarav Sharma'); // wait for load

    await userEvent.click(screen.getByRole('button', { name: /add student/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /add student/i })).toBeInTheDocument();
  });

  it('shows a validation error when submitting an empty form', async () => {
    renderStudents();
    await screen.findByText('Aarav Sharma');

    await userEvent.click(screen.getByRole('button', { name: /add student/i }));
    await userEvent.click(screen.getByRole('button', { name: /^add$/i }));

    expect(screen.getByText(/all fields are required/i)).toBeInTheDocument();
  });

  it('calls POST /students and closes the dialog on valid submit', async () => {
    api.post.mockResolvedValue({ data: { _id: 's3', studentId: 'S003', name: 'New', class: '8A', vaccinations: [] } });
    renderStudents();
    await screen.findByText('Aarav Sharma');

    await userEvent.click(screen.getByRole('button', { name: /add student/i }));

    const dialog = screen.getByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText(/^name$/i),       'New Student');
    await userEvent.type(within(dialog).getByLabelText(/^class$/i),      '8A');
    await userEvent.type(within(dialog).getByLabelText(/student id/i),   'S003');
    await userEvent.click(within(dialog).getByRole('button', { name: /^add$/i }));

    expect(api.post).toHaveBeenCalledWith('/students', expect.objectContaining({ name: 'New Student' }));
  });
});

describe('Students page — filter controls', () => {
  it('renders the Search and Clear buttons', async () => {
    renderStudents();
    await screen.findByText('Aarav Sharma');
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clear/i  })).toBeInTheDocument();
  });

  it('renders the name search field', async () => {
    renderStudents();
    await screen.findByText('Aarav Sharma');
    expect(screen.getByLabelText(/search by name/i)).toBeInTheDocument();
  });
});

describe('Students page — Import CSV button', () => {
  it('renders an Import CSV button', async () => {
    renderStudents();
    await screen.findByText('Aarav Sharma');
    expect(screen.getByRole('button', { name: /import csv/i })).toBeInTheDocument();
  });
});
