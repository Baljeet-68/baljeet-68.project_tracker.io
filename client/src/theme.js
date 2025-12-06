import { createTheme } from '@mui/material/styles'

// Material Dashboard Theme - Complete Design System
const theme = createTheme({
  palette: {
    primary: {
      main: '#51cbce',
      light: '#80e5e8',
      dark: '#26bcbf',
      contrastText: '#fff'
    },
    secondary: {
      main: '#6c757d',
      light: '#9ba3af',
      dark: '#495057',
      contrastText: '#fff'
    },
    success: {
      main: '#66bb6a',
      light: '#81c784',
      dark: '#388e3c'
    },
    warning: {
      main: '#fbc02d',
      light: '#ffee58',
      dark: '#f57f17'
    },
    error: {
      main: '#ef5350',
      light: '#ef9a9a',
      dark: '#d32f2f'
    },
    info: {
      main: '#29b6f6',
      light: '#64b5f6',
      dark: '#0277bd'
    },
    background: {
      default: '#eaeaea',
      paper: '#ffffff'
    },
    text: {
      primary: '#3c4858',
      secondary: '#9A9A9A',
      disabled: '#c1c1c1'
    },
    divider: 'rgba(0, 0, 0, 0.12)'
  },
  typography: {
    fontFamily: [
      'Montserrat',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif'
    ].join(','),
    h1: {
      fontSize: '3rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.5px'
    },
    h2: {
      fontSize: '2.25rem',
      fontWeight: 700,
      lineHeight: 1.3,
      letterSpacing: '-0.3px'
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.4
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      textTransform: 'uppercase'
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.5
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.5
    },
    body1: {
      fontSize: '0.95rem',
      fontWeight: 400,
      lineHeight: 1.6,
      color: '#3c4858'
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.6,
      color: '#9A9A9A'
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.4,
      color: '#9A9A9A'
    }
  },
  shape: {
    borderRadius: 12
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: false
      },
      styleOverrides: {
        root: {
          textTransform: 'uppercase',
          fontWeight: 600,
          borderRadius: 8,
          padding: '10px 24px',
          fontSize: '0.875rem',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)'
          }
        },
        contained: {
          boxShadow: '0 4px 12px 0 rgba(81, 203, 206, 0.3)',
          '&:hover': {
            boxShadow: '0 8px 20px 0 rgba(81, 203, 206, 0.4)'
          }
        },
        outlined: {
          border: '2px solid #51cbce',
          '&:hover': {
            border: '2px solid #26bcbf',
            backgroundColor: 'rgba(81, 203, 206, 0.08)'
          }
        },
        text: {
          '&:hover': {
            backgroundColor: 'rgba(81, 203, 206, 0.08)'
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 4px 0 rgba(0, 0, 0, 0.14), 0 4px 5px 0 rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.4)',
          border: 'none',
          backgroundColor: '#ffffff',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 5px 15px 0 rgba(0, 0, 0, 0.2), 0 8px 10px 0 rgba(0, 0, 0, 0.12), 0 3px 5px -1px rgba(0, 0, 0, 0.5)',
            transform: 'translateY(-4px)'
          }
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#3c4858',
          boxShadow: '0 1px 4px 0 rgba(0, 0, 0, 0.14)',
          borderBottom: 'none'
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
          boxShadow: '0 10px 30px -12px rgba(0, 0, 0, 0.42), 0 4px 25px 0px rgba(0, 0, 0, 0.12), 0 8px 10px -5px rgba(0, 0, 0, 0.2)',
          borderRight: 'none',
          borderRadius: 0
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '&:hover fieldset': {
              borderColor: 'rgba(81, 203, 206, 0.5)'
            },
            '&.Mui-focused fieldset': {
              borderColor: '#51cbce',
              boxShadow: '0 0 0 3px rgba(81, 203, 206, 0.1)'
            }
          }
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: '0.75rem',
          height: 28,
          borderRadius: 6,
          textTransform: 'uppercase',
          letterSpacing: '0.3px'
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: '#e3e3e3',
          padding: '16px',
          fontSize: '0.875rem'
        },
        head: {
          fontWeight: 700,
          backgroundColor: '#f4f3ef',
          color: '#3c4858',
          textTransform: 'uppercase',
          fontSize: '0.75rem',
          letterSpacing: '0.3px'
        }
      }
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(81, 203, 206, 0.05)'
          }
        }
      }
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 4px 0 rgba(0, 0, 0, 0.14), 0 4px 5px 0 rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.4)'
        }
      }
    }
  }
})

export default theme
