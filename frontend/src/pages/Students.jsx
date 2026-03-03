import React, { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
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
import AddIcon        from '@mui/icons-material/Add';
import DeleteIcon     from '@mui/icons-material/Delete';
import EditIcon       from '@mui/icons-material/Edit';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import VaccinesIcon   from '@mui/icons-material/Vaccines';
import api from '../api/axios';

const EMPTY_FORM = { name: '', class: '', studentId: '' };

export default function Students() {
  const [students, setStudents] = useState([]);
  const [drives,   setDrives]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  // Filter state
  const [filterName,       setFilterName]       = useState('');
  const [filterClass,      setFilterClass]      = useState('');
  const [filterVaccinated, setFilterVaccinated] = useState('');

  // Add / Edit dialog
  const [formOpen,  setFormOpen]  = useState(false);
  const [formMode,  setFormMode]  = useState('add');
  const [formData,  setFormData]  = useState(EMPTY_FORM);
  const [editId,    setEditId]    = useState(null);
  const [formError, setFormError] = useState('');

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId,   setDeleteId]   = useState(null);

  // Vaccinate dialog
  const [vaccinateOpen,    setVaccinateOpen]    = useState(false);
  const [vaccinateStudent, setVaccinateStudent] = useState(null);
  const [selectedDrive,    setSelectedDrive]    = useState('');
  const [vaccinateError,   setVaccinateError]   = useState('');

  // Import result banner
  const [importResult, setImportResult] = useState(null);

  // fetchStudents accepts explicit params to avoid stale-closure issues
  // when calling immediately after state resets (e.g. Clear button).
  const fetchStudents = (params) => {
    setLoading(true);
    setError('');
    const query = params !== undefined ? params : buildParams();
    api.get('/students', { params: query })
      .then((res) => setStudents(res.data))
      .catch(() => setError('Failed to load students'))
      .finally(() => setLoading(false));
  };

  const buildParams = () => {
    const p = {};
    if (filterName)       p.name       = filterName;
    if (filterClass)      p.class      = filterClass;
    if (filterVaccinated) p.vaccinated = filterVaccinated;
    return p;
  };

  useEffect(() => {
    fetchStudents({});
    api.get('/drives').then((res) => setDrives(res.data)).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const uniqueClasses = [...new Set(students.map((s) => s.class))].sort();

  // ── Add / Edit ────────────────────────────────────────────────────────────
  const openAdd = () => {
    setFormMode('add');
    setFormData(EMPTY_FORM);
    setFormError('');
    setFormOpen(true);
  };

  const openEdit = (student) => {
    setFormMode('edit');
    setEditId(student._id);
    setFormData({ name: student.name, class: student.class, studentId: student.studentId });
    setFormError('');
    setFormOpen(true);
  };

  const handleFormSubmit = async () => {
    if (!formData.name || !formData.class || !formData.studentId) {
      setFormError('All fields are required');
      return;
    }
    try {
      if (formMode === 'add') {
        await api.post('/students', formData);
      } else {
        await api.put(`/students/${editId}`, formData);
      }
      setFormOpen(false);
      fetchStudents(buildParams());
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to save student');
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const openDelete = (id) => { setDeleteId(id); setDeleteOpen(true); };

  const handleDelete = async () => {
    try { await api.delete(`/students/${deleteId}`); } catch { /* ignore */ }
    setDeleteOpen(false);
    fetchStudents(buildParams());
  };

  // ── Vaccinate ─────────────────────────────────────────────────────────────
  const openVaccinate = (student) => {
    setVaccinateStudent(student);
    setSelectedDrive('');
    setVaccinateError('');
    setVaccinateOpen(true);
  };

  const handleVaccinate = async () => {
    if (!selectedDrive) { setVaccinateError('Please select a drive'); return; }
    try {
      await api.post(`/students/${vaccinateStudent._id}/vaccinate`, { driveId: selectedDrive });
      setVaccinateOpen(false);
      fetchStudents(buildParams());
    } catch (err) {
      setVaccinateError(err.response?.data?.error || 'Failed to vaccinate student');
    }
  };

  // Drives the student has NOT yet been vaccinated for
  const availableDrives = (student) => {
    if (!student) return drives;
    const done = new Set(
      student.vaccinations.map((v) => (typeof v.drive === 'object' ? v.drive._id : v.drive))
    );
    return drives.filter((d) => !done.has(d._id));
  };

  // ── CSV Import ────────────────────────────────────────────────────────────
  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post('/students/import', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportResult({
        type:    'success',
        message: `Import complete: ${res.data.inserted} inserted, ${res.data.skipped} skipped`,
      });
      fetchStudents(buildParams());
    } catch (err) {
      setImportResult({ type: 'error', message: err.response?.data?.error || 'Import failed' });
    }
    e.target.value = '';
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" fontWeight={700}>Students</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" startIcon={<UploadFileIcon />} component="label">
            Import CSV
            <input type="file" accept=".csv" hidden onChange={handleImport} />
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
            Add Student
          </Button>
        </Box>
      </Box>

      {/* Import result */}
      {importResult && (
        <Alert
          severity={importResult.type}
          sx={{ mb: 2 }}
          onClose={() => setImportResult(null)}
        >
          {importResult.message}
        </Alert>
      )}

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          label="Search by name"
          size="small"
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
          sx={{ minWidth: 200 }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Class</InputLabel>
          <Select value={filterClass} label="Class" onChange={(e) => setFilterClass(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            {uniqueClasses.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 170 }}>
          <InputLabel>Vaccination Status</InputLabel>
          <Select value={filterVaccinated} label="Vaccination Status" onChange={(e) => setFilterVaccinated(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="true">Vaccinated</MenuItem>
            <MenuItem value="false">Not Vaccinated</MenuItem>
          </Select>
        </FormControl>
        <Button variant="contained" onClick={() => fetchStudents(buildParams())}>Search</Button>
        <Button variant="text" onClick={() => {
          setFilterName('');
          setFilterClass('');
          setFilterVaccinated('');
          fetchStudents({});
        }}>
          Clear
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Student ID</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Name</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Class</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">No students found</TableCell>
                </TableRow>
              ) : (
                students.map((student) => (
                  <TableRow key={student._id} hover>
                    <TableCell>{student.studentId}</TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.class}</TableCell>
                    <TableCell>
                      {student.vaccinations.length > 0 ? (
                        <Chip
                          label={`Vaccinated (${student.vaccinations.length})`}
                          color="success"
                          size="small"
                        />
                      ) : (
                        <Chip label="Not Vaccinated" color="default" size="small" />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title={availableDrives(student).length === 0 ? 'No available drives' : 'Vaccinate'}>
                        <span>
                          <IconButton
                            color="success"
                            onClick={() => openVaccinate(student)}
                            disabled={availableDrives(student).length === 0}
                          >
                            <VaccinesIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton color="primary" onClick={() => openEdit(student)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton color="error" onClick={() => openDelete(student._id)}>
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
        <DialogTitle>{formMode === 'add' ? 'Add Student' : 'Edit Student'}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <TextField
            label="Name" fullWidth margin="normal"
            value={formData.name}
            onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
          />
          <TextField
            label="Class" fullWidth margin="normal"
            value={formData.class}
            onChange={(e) => setFormData((p) => ({ ...p, class: e.target.value }))}
          />
          <TextField
            label="Student ID" fullWidth margin="normal"
            value={formData.studentId}
            onChange={(e) => setFormData((p) => ({ ...p, studentId: e.target.value }))}
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
          <Typography>Are you sure you want to delete this student? This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Vaccinate Dialog */}
      <Dialog open={vaccinateOpen} onClose={() => setVaccinateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Mark as Vaccinated</DialogTitle>
        <DialogContent>
          <Typography mb={2}>
            Student: <strong>{vaccinateStudent?.name}</strong>
          </Typography>
          {vaccinateError && <Alert severity="error" sx={{ mb: 2 }}>{vaccinateError}</Alert>}
          <FormControl fullWidth>
            <InputLabel>Select Drive</InputLabel>
            <Select
              value={selectedDrive}
              label="Select Drive"
              onChange={(e) => setSelectedDrive(e.target.value)}
            >
              {availableDrives(vaccinateStudent).map((d) => (
                <MenuItem key={d._id} value={d._id}>
                  {d.vaccineName} — {new Date(d.date).toLocaleDateString()} @ {d.location}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVaccinateOpen(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleVaccinate}>
            Mark Vaccinated
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
