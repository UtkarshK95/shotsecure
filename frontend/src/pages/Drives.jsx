import React, { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon    from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon   from '@mui/icons-material/Edit';
import api from '../api/axios';

const EMPTY_FORM = { vaccineName: '', date: '', location: '' };

export default function Drives() {
  const [drives,    setDrives]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [formOpen,  setFormOpen]  = useState(false);
  const [formMode,  setFormMode]  = useState('add');
  const [formData,  setFormData]  = useState(EMPTY_FORM);
  const [editId,    setEditId]    = useState(null);
  const [formError, setFormError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId,   setDeleteId]   = useState(null);

  const fetchDrives = () => {
    setLoading(true);
    api.get('/drives')
      .then((res) => setDrives(res.data))
      .catch(() => setError('Failed to load drives'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDrives(); }, []);

  // ── Add / Edit ────────────────────────────────────────────────────────────
  const openAdd = () => {
    setFormMode('add');
    setFormData(EMPTY_FORM);
    setFormError('');
    setFormOpen(true);
  };

  const openEdit = (drive) => {
    setFormMode('edit');
    setEditId(drive._id);
    setFormData({
      vaccineName: drive.vaccineName,
      date:        drive.date ? drive.date.split('T')[0] : '',
      location:    drive.location,
    });
    setFormError('');
    setFormOpen(true);
  };

  const handleFormSubmit = async () => {
    if (!formData.vaccineName || !formData.date || !formData.location) {
      setFormError('All fields are required');
      return;
    }
    try {
      if (formMode === 'add') {
        await api.post('/drives', formData);
      } else {
        await api.put(`/drives/${editId}`, formData);
      }
      setFormOpen(false);
      fetchDrives();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to save drive');
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const openDelete = (id) => { setDeleteId(id); setDeleteOpen(true); };

  const handleDelete = async () => {
    try { await api.delete(`/drives/${deleteId}`); } catch { /* ignore */ }
    setDeleteOpen(false);
    fetchDrives();
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Vaccination Drives</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
          Add Drive
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Vaccine Name</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Location</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {drives.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">No drives found</TableCell>
                </TableRow>
              ) : (
                drives.map((drive) => (
                  <TableRow key={drive._id} hover>
                    <TableCell>{drive.vaccineName}</TableCell>
                    <TableCell>{new Date(drive.date).toLocaleDateString()}</TableCell>
                    <TableCell>{drive.location}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton color="primary" onClick={() => openEdit(drive)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton color="error" onClick={() => openDelete(drive._id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{formMode === 'add' ? 'Add Vaccination Drive' : 'Edit Drive'}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <TextField
            label="Vaccine Name" fullWidth margin="normal"
            value={formData.vaccineName}
            onChange={(e) => setFormData((p) => ({ ...p, vaccineName: e.target.value }))}
          />
          <TextField
            label="Date" type="date" fullWidth margin="normal"
            value={formData.date}
            onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Location" fullWidth margin="normal"
            value={formData.location}
            onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleFormSubmit}>
            {formMode === 'add' ? 'Add' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this drive?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
