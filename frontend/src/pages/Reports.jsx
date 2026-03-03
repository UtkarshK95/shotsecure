import React, { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
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
  Typography,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import api from '../api/axios';

export default function Reports() {
  const [rows,    setRows]    = useState([]);
  const [drives,  setDrives]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // Filters
  const [filterVaccine,    setFilterVaccine]    = useState('');
  const [filterClass,      setFilterClass]      = useState('');
  const [filterVaccinated, setFilterVaccinated] = useState('');

  // Unique vaccine names derived from drives list (stable across filter changes)
  const uniqueVaccines = [...new Set(drives.map((d) => d.vaccineName))].sort();
  // Unique classes derived from current report rows
  const uniqueClasses  = [...new Set(rows.map((r) => r.class))].sort();

  const fetchReport = (params = {}) => {
    setLoading(true);
    setError('');
    api.get('/reports', { params })
      .then((res) => setRows(res.data))
      .catch(() => setError('Failed to load report'))
      .finally(() => setLoading(false));
  };

  const buildParams = () => {
    const p = {};
    if (filterVaccine)    p.vaccineName = filterVaccine;
    if (filterClass)      p.class       = filterClass;
    if (filterVaccinated) p.vaccinated  = filterVaccinated;
    return p;
  };

  useEffect(() => {
    api.get('/drives').then((res) => setDrives(res.data)).catch(() => {});
    fetchReport({});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApply = () => fetchReport(buildParams());

  const handleClear = () => {
    setFilterVaccine('');
    setFilterClass('');
    setFilterVaccinated('');
    fetchReport({});
  };

  // CSV export uses fetch directly so the browser triggers a file download
  const handleExportCSV = () => {
    const params = new URLSearchParams({ format: 'csv', ...buildParams() });
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5002/api"}/reports?${params.toString()}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href     = url;
        a.download = 'vaccination-report.csv';
        a.click();
        URL.revokeObjectURL(url);
      });
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" fontWeight={700}>Vaccination Reports</Typography>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExportCSV}
          disabled={rows.length === 0}
        >
          Export CSV
        </Button>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Vaccine Name</InputLabel>
          <Select value={filterVaccine} label="Vaccine Name" onChange={(e) => setFilterVaccine(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            {uniqueVaccines.map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
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
        <Button variant="contained" onClick={handleApply}>Apply Filters</Button>
        <Button variant="text" onClick={handleClear}>Clear</Button>
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
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Vaccine</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Location</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">No records found</TableCell>
                </TableRow>
              ) : (
                rows.map((row, i) => (
                  <TableRow key={i} hover>
                    <TableCell>{row.studentId}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.class}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.vaccinated}
                        color={row.vaccinated === 'Yes' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{row.vaccineName || '—'}</TableCell>
                    <TableCell>{row.date       || '—'}</TableCell>
                    <TableCell>{row.location   || '—'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
