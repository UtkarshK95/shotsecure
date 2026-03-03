import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Typography,
} from '@mui/material';
import PeopleIcon  from '@mui/icons-material/People';
import VaccinesIcon from '@mui/icons-material/Vaccines';
import EventIcon   from '@mui/icons-material/Event';
import api from '../api/axios';

function StatCard({ title, value, icon, color }) {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ color, fontSize: 48, lineHeight: 1 }}>{icon}</Box>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              {value ?? '—'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/students'), api.get('/drives')])
      .then(([studentsRes, drivesRes]) => {
        const students = studentsRes.data;
        const drives   = drivesRes.data;
        const vaccinated   = students.filter((s) => s.vaccinations.length > 0).length;
        const upcomingDrives = drives.filter((d) => new Date(d.date) >= new Date()).length;
        setStats({
          total:          students.length,
          vaccinated,
          unvaccinated:   students.length - vaccinated,
          drives:         drives.length,
          upcomingDrives,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1100, mx: 'auto' }}>
      <Typography variant="h5" fontWeight={700} mb={3}>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Students"
            value={stats?.total}
            icon={<PeopleIcon fontSize="inherit" />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Vaccinated"
            value={stats?.vaccinated}
            icon={<VaccinesIcon fontSize="inherit" />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Not Vaccinated"
            value={stats?.unvaccinated}
            icon={<PeopleIcon fontSize="inherit" />}
            color="error.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Upcoming Drives"
            value={stats?.upcomingDrives}
            icon={<EventIcon fontSize="inherit" />}
            color="secondary.main"
          />
        </Grid>
      </Grid>
    </Box>
  );
}
