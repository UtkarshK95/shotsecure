import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = [
  { label: 'Dashboard', path: '/' },
  { label: 'Students',  path: '/students' },
  { label: 'Drives',    path: '/drives' },
  { label: 'Reports',   path: '/reports' },
];

export default function Navbar() {
  const { logout } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const theme      = useTheme();
  const isMobile   = useMediaQuery(theme.breakpoints.down('md'));

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl,   setAnchorEl]   = useState(null);

  const handleAvatarClick = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose   = ()  => setAnchorEl(null);

  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate('/login');
  };

  return (
    <>
      <AppBar position="fixed">
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setDrawerOpen(true)}
              sx={{ mr: 1 }}
              aria-label="open navigation menu"
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography variant="h6" fontWeight={700} sx={{ flexGrow: isMobile ? 1 : 0, mr: 4 }}>
            ShotSecure
          </Typography>

          {!isMobile && (
            <Box sx={{ flexGrow: 1 }}>
              {NAV_LINKS.map((link) => (
                <Button
                  key={link.path}
                  color="inherit"
                  onClick={() => navigate(link.path)}
                  sx={{
                    fontWeight:   location.pathname === link.path ? 700 : 400,
                    borderBottom: location.pathname === link.path ? '2px solid white' : 'none',
                    borderRadius: 0,
                    mr: 1,
                  }}
                >
                  {link.label}
                </Button>
              ))}
            </Box>
          )}

          <IconButton onClick={handleAvatarClick} sx={{ ml: 'auto' }} aria-label="account menu">
            <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32, fontSize: 14 }}>
              A
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem disabled>admin</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <List sx={{ width: 220, mt: 2 }}>
          {NAV_LINKS.map((link) => (
            <ListItemButton
              key={link.path}
              selected={location.pathname === link.path}
              onClick={() => {
                navigate(link.path);
                setDrawerOpen(false);
              }}
            >
              <ListItemText primary={link.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>
    </>
  );
}
