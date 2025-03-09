import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Tooltip,
  Switch,
  InputAdornment,
  CircularProgress,
  useTheme,
  ThemeProvider,
  createTheme,
  CssBaseline,
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import { auth, db, refreshAuth } from './firebase';
import { signOut } from 'firebase/auth';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, limit } from 'firebase/firestore';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import MicIcon from '@mui/icons-material/Mic';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsIcon from '@mui/icons-material/Notifications';
import VideocamIcon from '@mui/icons-material/Videocam';
import CallIcon from '@mui/icons-material/Call';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import io from 'socket.io-client';
import Auth from './components/Auth';

const socket = io(process.env.REACT_APP_SOCKET_SERVER_URL, {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  transports: ['websocket'],
  secure: true,
  rejectUnauthorized: false,
  path: '/socket.io',
  withCredentials: true,
  autoConnect: false
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#2196f3',
      light: '#64b5f6',
      dark: '#1976d2'
    },
    background: {
      default: '#121212',
      paper: '#1E1E1E'
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)'
    }
  },
  shape: {
    borderRadius: 12
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#1E1E1E'
        }
      }
    }
  }
});

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2196f3',
      light: '#64b5f6',
      dark: '#1976d2'
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff'
    },
    text: {
      primary: '#000000',
      secondary: 'rgba(0, 0, 0, 0.7)'
    }
  },
  shape: {
    borderRadius: 12
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#ffffff'
        }
      }
    }
  }
});

const SidebarWrapper = styled(Box)(({ theme }) => ({
  width: 320,
  backgroundColor: alpha(theme.palette.background.paper, 0.8),
  backdropFilter: 'blur(10px)',
  borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  display: 'flex',
  flexDirection: 'column',
  height: '100vh'
}));

const ChatWrapper = styled(Box)(({ theme }) => ({
  flex: 1,
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: theme.palette.background.default,
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: 'radial-gradient(circle at center, #1a237e 0%, transparent 70%)',
    opacity: 0.05,
    pointerEvents: 'none'
  }
}));

const MessageContainer = styled(Box)(({ theme, sent }) => ({
  padding: theme.spacing(1.5, 2),
  borderRadius: sent ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
  maxWidth: '70%',
  width: 'fit-content',
  marginBottom: theme.spacing(1),
  position: 'relative',
  wordBreak: 'break-word',
  backgroundColor: sent 
    ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`
    : alpha(theme.palette.background.paper, 0.6),
  boxShadow: sent
    ? '0 2px 8px rgba(33, 150, 243, 0.3)'
    : '0 2px 8px rgba(0, 0, 0, 0.1)',
  backdropFilter: 'blur(10px)',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-1px)'
  }
}));

const StyledInput = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: alpha(theme.palette.background.paper, 0.8),
    backdropFilter: 'blur(10px)',
    borderRadius: 30,
    '&:hover': {
      backgroundColor: alpha(theme.palette.background.paper, 0.9)
    },
    '& fieldset': {
      borderColor: 'transparent'
    }
  }
}));

const ActionButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.primary.main,
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1)
  }
}));

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [user, setUser] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [darkMode, setDarkMode] = useState(process.env.REACT_APP_DEFAULT_THEME === 'dark');
  const [socketConnected, setSocketConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);

  useEffect(() => {
    console.log('Setting up auth state observer');
    
    const handleAuthChange = async (user) => {
      if (user) {
        try {
          // Force token refresh on auth state change
          await user.getIdToken(true);
          console.log('Auth state changed: User logged in');
          console.log('User ID:', user.uid);
          console.log('User email:', user.email);
          
          setUser(user);
          
          // Emit socket event for user joining
          socket.emit('user_join', {
            name: user.displayName || 'Anonymous',
            email: user.email,
            uid: user.uid
          });
        } catch (error) {
          console.error('Error handling auth state:', error);
          // If token refresh fails, sign out
          await signOut(auth);
          setUser(null);
          setMessages([]);
        }
      } else {
        console.log('User signed out');
        setUser(null);
        setMessages([]);
      }
    };

    const unsubscribe = auth.onAuthStateChanged(handleAuthChange);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      console.log('No user, skipping message load');
      return;
    }

    console.log('Loading messages for user:', user.uid);
    
    try {
      const messagesRef = collection(db, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(50));

      console.log('Setting up messages listener');
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        try {
          const loadedMessages = snapshot.docs.map(doc => {
            const data = doc.data();
            const timestamp = data.timestamp?.toDate?.() || new Date(data.createdAt || Date.now());
            
            return {
              id: doc.id,
              ...data,
              timestamp: timestamp
            };
          });
          
          // Sort messages by timestamp
          const sortedMessages = loadedMessages.sort((a, b) => 
            a.timestamp - b.timestamp
          );
          
          console.log('Loaded messages:', sortedMessages.length);
          setMessages(sortedMessages);
        } catch (error) {
          console.error('Error processing messages:', error);
        }
      }, (error) => {
        console.error('Firestore subscription error:', error);
        if (error.code === 'permission-denied') {
          console.log('Current user:', auth.currentUser);
          alert('Authentication error. Please sign out and sign in again.');
        }
      });

      return () => {
        console.log('Cleaning up messages listener');
        unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up message listener:', error);
    }
  }, [user]);

  // Connect socket when component mounts
  useEffect(() => {
    if (user) {
      console.log('Attempting to connect to socket server');
      socket.connect();
    }
    return () => {
      if (socket.connected) {
        console.log('Disconnecting from socket server');
        socket.disconnect();
      }
    };
  }, [user]);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to socket server');
      setSocketConnected(true);
      setReconnecting(false);
      
      // Re-emit user join event if user is authenticated
      if (auth.currentUser) {
        socket.emit('user_join', {
          name: auth.currentUser.displayName || 'Anonymous',
          email: auth.currentUser.email,
          uid: auth.currentUser.uid
        });
      }
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      setSocketConnected(false);
      setReconnecting(true);
      
      // If websocket fails, try polling
      if (socket.io.opts.transports[0] === 'websocket') {
        console.log('Falling back to polling transport');
        socket.io.opts.transports = ['polling', 'websocket'];
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from socket server:', reason);
      setSocketConnected(false);
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        socket.connect();
      }
      
      if (reason === 'transport close' || reason === 'ping timeout') {
        setReconnecting(true);
        // Try to reconnect with exponential backoff
        setTimeout(() => {
          if (!socket.connected && user) {
            console.log('Attempting to reconnect...');
            socket.connect();
          }
        }, Math.random() * 1000);
      }
    });

    socket.on('receive_message', (data) => {
      console.log('Received message from socket:', data);
      // Don't add duplicate messages that we already have from Firestore
      setMessages((prev) => {
        if (!prev.some(msg => msg.id === data.id)) {
          return [...prev, data];
        }
        return prev;
      });
    });

    socket.on('users_update', (users) => {
      console.log('Users update:', users);
      setOnlineUsers(users);
    });

    socket.on('typing', (data) => {
      setIsTyping(data.isTyping);
    });

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('disconnect');
      socket.off('receive_message');
      socket.off('users_update');
      socket.off('typing');
    };
  }, [user]);

  const handleSignOut = async () => {
    try {
      setMessages([]); // Clear messages first
      await signOut(auth);
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      // Force clear user state even if sign out fails
      setUser(null);
      setMessages([]);
      alert('Error signing out. Please refresh the page.');
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    // Check if user is authenticated
    if (!user) {
      console.error('User is not authenticated');
      alert('Please sign in to send messages');
      return;
    }

    // Validate input
    if (!input.trim()) {
      return;
    }

    try {
      // Create message data
      const messageData = {
        text: input.trim(),
        userId: user.uid,
        sender: user.displayName || 'Anonymous',
        timestamp: serverTimestamp(),
        email: user.email,
        createdAt: new Date().toISOString() // Fallback timestamp
      };

      // Save to Firestore
      const docRef = await addDoc(collection(db, 'messages'), messageData);
      console.log('Message saved successfully with ID:', docRef.id);

      // Emit socket event
      socket.emit('send_message', {
        ...messageData,
        id: docRef.id,
        timestamp: new Date().toISOString()
      });

      // Clear input
      setInput('');
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Show user-friendly error
      if (error.code === 'permission-denied') {
        alert('You do not have permission to send messages. Please sign in again.');
      } else {
        alert('Failed to send message. Please try again.');
      }
    }
  };

  if (!user) {
    return (
      <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
        <CssBaseline />
        <Auth />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh' }}>
        <SidebarWrapper>
          {/* User Profile */}
          <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  variant="dot"
                  color="success"
                >
                  <Avatar
                    src={user.photoURL}
                    alt={user.displayName}
                    sx={{ width: 40, height: 40 }}
                  >
                    {user.displayName?.[0] || 'A'}
                  </Avatar>
                </Badge>
                <Box>
                  <Typography variant="subtitle1" fontWeight="500">
                    {user.displayName || 'Anonymous'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Online
                  </Typography>
                </Box>
              </Box>
              <Box>
                <Tooltip title="Toggle Theme">
                  <IconButton onClick={() => setDarkMode(!darkMode)} size="small">
                    {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Sign Out">
                  <IconButton onClick={handleSignOut} size="small">
                    <LogoutIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Search Bar */}
            <StyledInput
              fullWidth
              placeholder="Search chats..."
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Online Users */}
          <List sx={{ flex: 1, overflow: 'auto', py: 0 }}>
            {onlineUsers.map((user, index) => (
              <ListItemButton
                key={index}
                sx={{
                  py: 1.5,
                  px: 2,
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.05)'
                  }
                }}
              >
                <ListItemAvatar>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    variant="dot"
                    color="success"
                  >
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {user.name[0].toUpperCase()}
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primary={user.name}
                  secondary="Online"
                  primaryTypographyProps={{
                    fontWeight: 500,
                    fontSize: '0.95rem'
                  }}
                  secondaryTypographyProps={{
                    color: 'success.main',
                    fontSize: '0.8rem'
                  }}
                />
              </ListItemButton>
            ))}
          </List>

          {/* Bottom Actions */}
          <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
              <Tooltip title="Settings">
                <ActionButton>
                  <SettingsIcon />
                </ActionButton>
              </Tooltip>
              <Tooltip title="Notifications">
                <ActionButton>
                  <NotificationsIcon />
                </ActionButton>
              </Tooltip>
            </Box>
          </Box>
        </SidebarWrapper>

        <ChatWrapper>
          {/* Chat Header */}
          <Box sx={{ 
            p: 2, 
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            backgroundColor: alpha(darkTheme.palette.background.paper, 0.8),
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>G</Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight="500">
                  {process.env.REACT_APP_APP_NAME}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {onlineUsers.length} online
                  </Typography>
                  {reconnecting ? (
                    <CircularProgress size={12} />
                  ) : (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: socketConnected ? 'success.main' : 'error.main'
                      }}
                    />
                  )}
                </Box>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Voice Call">
                <ActionButton>
                  <CallIcon />
                </ActionButton>
              </Tooltip>
              <Tooltip title="Video Call">
                <ActionButton>
                  <VideocamIcon />
                </ActionButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Messages */}
          <Box sx={{ 
            flex: 1, 
            overflow: 'auto', 
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 1
          }}>
            {messages.map((msg, index) => {
              const isSent = msg.userId === user?.uid;
              return (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: isSent ? 'flex-end' : 'flex-start',
                    alignItems: 'flex-end',
                    gap: 1
                  }}
                >
                  {!isSent && (
                    <Avatar sx={{ width: 32, height: 32 }}>
                      {msg.sender?.[0]?.toUpperCase()}
                    </Avatar>
                  )}
                  <MessageContainer sent={isSent}>
                    <Typography variant="body1" color="text.primary">
                      {msg.text}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ 
                        display: 'block',
                        mt: 0.5,
                        textAlign: 'right',
                        opacity: 0.7
                      }}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </Typography>
                  </MessageContainer>
                </Box>
              );
            })}
            {isTyping && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
                <CircularProgress size={16} />
                <Typography variant="caption" color="text.secondary">
                  Someone is typing...
                </Typography>
              </Box>
            )}
          </Box>

          {/* Message Input */}
          <Box sx={{ 
            p: 2,
            borderTop: '1px solid rgba(255,255,255,0.1)',
            backgroundColor: alpha(darkTheme.palette.background.paper, 0.8),
            backdropFilter: 'blur(10px)'
          }}>
            <form onSubmit={sendMessage}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Tooltip title="Attach File">
                  <ActionButton size="small">
                    <AttachFileIcon />
                  </ActionButton>
                </Tooltip>
                <StyledInput
                  fullWidth
                  placeholder="Type a message..."
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    socket.emit('typing', { isTyping: e.target.value.length > 0 });
                  }}
                  size="small"
                />
                <Tooltip title="Emoji">
                  <ActionButton size="small">
                    <EmojiEmotionsIcon />
                  </ActionButton>
                </Tooltip>
                <Tooltip title="Voice Message">
                  <ActionButton size="small">
                    <MicIcon />
                  </ActionButton>
                </Tooltip>
                <Tooltip title="Send">
                  <span>
                    <ActionButton 
                      type="submit" 
                      size="small"
                      disabled={!input.trim()}
                      sx={{
                        bgcolor: 'primary.main',
                        '&:hover': {
                          bgcolor: 'primary.dark'
                        },
                        '&.Mui-disabled': {
                          bgcolor: 'action.disabledBackground'
                        }
                      }}
                    >
                      <SendIcon />
                    </ActionButton>
                  </span>
                </Tooltip>
              </Box>
            </form>
          </Box>
        </ChatWrapper>
      </Box>
    </ThemeProvider>
  );
}

export default App;
