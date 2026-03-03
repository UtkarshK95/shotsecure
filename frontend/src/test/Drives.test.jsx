import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent                   from '@testing-library/user-event';
import { MemoryRouter }            from 'react-router-dom';
import Drives                      from '../pages/Drives';
import api                         from '../api/axios';

vi.mock('../api/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true }),
}));

const MOCK_DRIVES = [
  { _id: 'd1', vaccineName: 'Hepatitis B', date: '2026-01-15T00:00:00.000Z', location: 'Main Hall'   },
  { _id: 'd2', vaccineName: 'Polio (OPV)', date: '2026-02-20T00:00:00.000Z', location: 'Gymnasium'   },
];

beforeEach(() => {
  vi.clearAllMocks();
  api.get.mockResolvedValue({ data: MOCK_DRIVES });
});

const renderDrives = () =>
  render(<MemoryRouter><Drives /></MemoryRouter>);

describe('Drives page — initial render', () => {
  it('shows a loading spinner while fetching', () => {
    api.get.mockReturnValue(new Promise(() => {}));
    renderDrives();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders the page heading', async () => {
    renderDrives();
    expect(await screen.findByText('Vaccination Drives')).toBeInTheDocument();
  });

  it('renders all drive rows', async () => {
    renderDrives();
    expect(await screen.findByText('Hepatitis B')).toBeInTheDocument();
    expect(screen.getByText('Polio (OPV)')).toBeInTheDocument();
  });

  it('renders drive locations', async () => {
    renderDrives();
    await screen.findByText('Hepatitis B');
    expect(screen.getByText('Main Hall')).toBeInTheDocument();
    expect(screen.getByText('Gymnasium')).toBeInTheDocument();
  });

  it('shows "No drives found" when the list is empty', async () => {
    api.get.mockResolvedValue({ data: [] });
    renderDrives();
    expect(await screen.findByText(/no drives found/i)).toBeInTheDocument();
  });
});

describe('Drives page — Add Drive dialog', () => {
  it('opens the Add Drive dialog when the button is clicked', async () => {
    renderDrives();
    await screen.findByText('Hepatitis B');

    await userEvent.click(screen.getByRole('button', { name: /add drive/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /add vaccination drive/i })).toBeInTheDocument();
  });

  it('shows a validation error when submitting with empty fields', async () => {
    renderDrives();
    await screen.findByText('Hepatitis B');

    await userEvent.click(screen.getByRole('button', { name: /add drive/i }));
    await userEvent.click(screen.getByRole('button', { name: /^add$/i }));

    expect(screen.getByText(/all fields are required/i)).toBeInTheDocument();
  });

  it('calls POST /drives with form data on valid submit', async () => {
    api.post.mockResolvedValue({ data: { _id: 'd3', vaccineName: 'MMR', date: '2026-04-10', location: 'Lab' } });
    renderDrives();
    await screen.findByText('Hepatitis B');

    await userEvent.click(screen.getByRole('button', { name: /add drive/i }));

    const dialog = screen.getByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText(/vaccine name/i), 'MMR');
    await userEvent.type(within(dialog).getByLabelText(/date/i),         '2026-04-10');
    await userEvent.type(within(dialog).getByLabelText(/location/i),     'Medical Lab');
    await userEvent.click(within(dialog).getByRole('button', { name: /^add$/i }));

    expect(api.post).toHaveBeenCalledWith('/drives', expect.objectContaining({ vaccineName: 'MMR' }));
  });
});

describe('Drives page — Edit and Delete', () => {
  it('renders Edit and Delete action buttons for each drive row', async () => {
    renderDrives();
    await screen.findByText('Hepatitis B');

    const editButtons   = screen.getAllByRole('button', { name: /edit/i   });
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    expect(editButtons.length).toBe(MOCK_DRIVES.length);
    expect(deleteButtons.length).toBe(MOCK_DRIVES.length);
  });

  it('opens a confirmation dialog when Delete is clicked', async () => {
    renderDrives();
    await screen.findByText('Hepatitis B');

    await userEvent.click(screen.getAllByRole('button', { name: /delete/i })[0]);
    expect(screen.getByText(/confirm delete/i)).toBeInTheDocument();
  });
});
