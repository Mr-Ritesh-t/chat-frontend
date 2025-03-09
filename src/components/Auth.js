import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
  Container,
  CircularProgress,
  useTheme,
  IconButton,
  InputAdornment,
  Fade
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { auth } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import ChatIcon from '@mui/icons-material/Chat';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(3),
  maxWidth: 400,
  width: '100%',
  margin: '40px auto',
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '8px',
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`
  }
}));

const Form = styled('form')(({ theme }) => ({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2.5)
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.shape.borderRadius * 1.5,
    transition: theme.transitions.create(['box-shadow']),
    '&:hover': {
      backgroundColor: theme.palette.action.hover
    },
    '&.Mui-focused': {
      boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)'
    }
  },
  '& .MuiOutlinedInput-input': {
    padding: '14px 16px'
  }
}));

const LogoBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2)
}));

function Auth() {
  const theme = useTheme();
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const getErrorMessage = (code) => {
    switch (code) {
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please try again.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.';
      default:
        return 'An error occurred. Please try again.';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Set persistence to LOCAL
      await setPersistence(auth, browserLocalPersistence);

      if (isSignUp) {
        if (formData.password.length < 6) {
          throw new Error('auth/weak-password');
        }

        // Create new user
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );
        
        // Update user profile with display name
        await updateProfile(userCredential.user, {
          displayName: formData.name || formData.email.split('@')[0]
        });
      } else {
        // Sign in existing user
        await signInWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(getErrorMessage(err.code || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <Container maxWidth="sm" sx={{ 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      py: 4
    }}>
      <Fade in timeout={800}>
        <StyledPaper elevation={0}>
          <LogoBox>
            <Box sx={{ 
              p: 2,
              borderRadius: '50%',
              bgcolor: theme.palette.primary.main + '10',
              color: theme.palette.primary.main
            }}>
              <ChatIcon sx={{ fontSize: 40 }} />
            </Box>
            <Typography variant="h5" component="h1" fontWeight="600" textAlign="center">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              {isSignUp 
                ? 'Start chatting with your friends'
                : 'Please enter your details to sign in'}
            </Typography>
          </LogoBox>

          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                width: '100%',
                borderRadius: 2,
                alignItems: 'center'
              }}
            >
              {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            {isSignUp && (
              <StyledTextField
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                fullWidth
                autoComplete="name"
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            )}
            
            <StyledTextField
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              fullWidth
              autoComplete="email"
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlinedIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
            
            <StyledTextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              fullWidth
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              disabled={loading}
              helperText={isSignUp ? 'Password must be at least 6 characters long' : ''}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? (
                        <VisibilityOffOutlinedIcon fontSize="small" />
                      ) : (
                        <VisibilityOutlinedIcon fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={loading}
              sx={{
                py: 1.5,
                mt: 1,
                borderRadius: 3,
                textTransform: 'none',
                fontSize: '1rem'
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </Button>
          </Form>

          <Box sx={{ 
            mt: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1
          }}>
            <Typography variant="body2" color="text.secondary">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            </Typography>
            <Link
              component="button"
              variant="body2"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setFormData({ name: '', email: '', password: '' });
              }}
              disabled={loading}
              sx={{
                textDecoration: 'none',
                fontWeight: 500,
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              {isSignUp ? 'Sign in here' : 'Create an account'}
            </Link>
          </Box>
        </StyledPaper>
      </Fade>
    </Container>
  );
}

export default Auth; 