import React from 'react';
import { AppBar, Toolbar, Typography, Container } from '@mui/material';

const Header: React.FC = () => {
  return (
    <AppBar position="static" sx={{ bgcolor: '#B71C1C' }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          <Typography
            variant="h1"
            sx={{
              color: 'white',
              fontSize: { xs: '1.5rem', sm: '2rem' },
              flexGrow: 1,
              textAlign: 'center'
            }}
          >
            BKPOC
          </Typography>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;