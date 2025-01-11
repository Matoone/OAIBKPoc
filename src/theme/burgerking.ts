import { createTheme } from '@mui/material/styles';
import '@fontsource/montserrat/400.css';  // regular
import '@fontsource/montserrat/700.css';  // bold

export const burgerKingTheme = createTheme({
  palette: {
    primary: {
      main: '#502314', // Marron BK
      contrastText: '#FFF8F3',
    },
    secondary: {
      main: '#2B7B2B', // Vert BK
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#FFF8F3', // Beige clair
      paper: '#FFFFFF',
    },
    error: {
      main: '#B71C1C', // Rouge BK
    },
  },
  typography: {
    fontFamily: 'Montserrat, Arial, sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      color: '#502314',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      color: '#502314',
    },
    body1: {
      fontSize: '1rem',
      color: '#502314',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none',
          fontWeight: 700,
        },
      },
    },
  },
});