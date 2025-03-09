import React, { useState, useEffect, useCallback } from 'react';
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
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

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
      default: '#0A1929',
      paper: '#132F4C'
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)'
    }
  },
  shape: {
    borderRadius: 16
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#132F4C'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8
        }
      }
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2rem',
      fontWeight: 600
    },
    h2: {
      fontSize: '1.75rem',
      fontWeight: 600
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500
    },
    body1: {
      fontSize: '0.9375rem'
    },
    caption: {
      fontSize: '0.75rem'
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
      default: '#F3F6F9',
      paper: '#ffffff'
    },
    text: {
      primary: '#0A1929',
      secondary: 'rgba(10, 25, 41, 0.7)'
    }
  },
  shape: {
    borderRadius: 16
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#ffffff',
          boxShadow: '0 2px 12px rgba(0,0,0,0.1)'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8
        }
      }
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2rem',
      fontWeight: 600
    },
    h2: {
      fontSize: '1.75rem',
      fontWeight: 600
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500
    },
    body1: {
      fontSize: '0.9375rem'
    },
    caption: {
      fontSize: '0.75rem'
    }
  }
});

const SidebarWrapper = styled(Box)(({ theme }) => ({
  width: 320,
  backgroundColor: alpha(theme.palette.background.paper, 0.98),
  backdropFilter: 'blur(20px)',
  borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    position: 'fixed',
    zIndex: 1200,
    transform: 'translateX(-100%)',
    '&.open': {
      transform: 'translateX(0)'
    }
  }
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
    backgroundImage: theme.palette.mode === 'dark' 
      ? 'radial-gradient(circle at 50% -50%, #1976d2 0%, transparent 75%)'
      : 'radial-gradient(circle at 50% -50%, #64b5f6 0%, transparent 75%)',
    opacity: 0.15,
    pointerEvents: 'none'
  },
  [theme.breakpoints.down('sm')]: {
    width: '100%'
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
    ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.9 : 0.9)
    : alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.5 : 0.95),
  boxShadow: sent
    ? '0 2px 12px rgba(33, 150, 243, 0.3)'
    : '0 2px 12px rgba(0, 0, 0, 0.1)',
  backdropFilter: 'blur(10px)',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: sent
      ? '0 4px 16px rgba(33, 150, 243, 0.4)'
      : '0 4px 16px rgba(0, 0, 0, 0.15)'
  },
  [theme.breakpoints.down('sm')]: {
    maxWidth: '85%',
    padding: theme.spacing(1, 1.5)
  }
}));

const StyledInput = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.5 : 0.95),
    backdropFilter: 'blur(10px)',
    borderRadius: 30,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      backgroundColor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.6 : 1),
      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)'
    },
    '&.Mui-focused': {
      backgroundColor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.7 : 1),
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)'
    },
    '& fieldset': {
      borderColor: 'transparent'
    }
  }
}));

const ActionButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.primary.main,
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.2),
    transform: 'scale(1.05)'
  },
  '&:active': {
    transform: 'scale(0.95)'
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = window.innerWidth <= 600;
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [windowFocused, setWindowFocused] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [privateMessages, setPrivateMessages] = useState({});
  const [activeChats, setActiveChats] = useState([]);

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

  // Handle notification permission
  const requestNotificationPermission = useCallback(async () => {
    try {
      if (!("Notification" in window)) {
        console.log("This browser does not support notifications");
        return;
      }

      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === "granted");
      console.log("Notification permission:", permission);
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    }
  }, []);

  // Show notification
  const showNotification = useCallback((message) => {
    if (!notificationsEnabled || windowFocused) return;

    try {
      const notification = new Notification(message.sender || "New Message", {
        body: message.text,
        icon: "/favicon.ico", // Add your app icon path here
        badge: "/favicon.ico", // Add your app icon path here
        tag: "chat-message",
        renotify: true,
        silent: false,
        timestamp: message.timestamp,
        data: {
          messageId: message.id,
          userId: message.userId
        }
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    } catch (error) {
      console.error("Error showing notification:", error);
    }
  }, [notificationsEnabled, windowFocused]);

  // Handle window focus
  useEffect(() => {
    const handleFocus = () => setWindowFocused(true);
    const handleBlur = () => setWindowFocused(false);

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Check notification permission on mount
  useEffect(() => {
    if ("Notification" in window) {
      setNotificationsEnabled(Notification.permission === "granted");
    }
  }, []);

  // Socket event handlers
  const handleReceiveMessage = useCallback((data) => {
    console.log('Received message from socket:', data);
    // Show notification for new messages
    if (data.userId !== user?.uid) {
      showNotification(data);
    }
    // Don't add duplicate messages that we already have from Firestore
    setMessages((prev) => {
      if (!prev.some(msg => msg.id === data.id)) {
        return [...prev, data];
      }
      return prev;
    });
  }, [user, showNotification]);

  // Socket connection effect
  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to socket server');
      setSocketConnected(true);
      setReconnecting(false);
      
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
      
      if (socket.io.opts.transports[0] === 'websocket') {
        console.log('Falling back to polling transport');
        socket.io.opts.transports = ['polling', 'websocket'];
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from socket server:', reason);
      setSocketConnected(false);
      
      if (reason === 'io server disconnect') {
        socket.connect();
      }
      
      if (reason === 'transport close' || reason === 'ping timeout') {
        setReconnecting(true);
        setTimeout(() => {
          if (!socket.connected && user) {
            console.log('Attempting to reconnect...');
            socket.connect();
          }
        }, Math.random() * 1000);
      }
    });

    socket.on('receive_message', handleReceiveMessage);

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
  }, [user, handleReceiveMessage]);

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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebarOnMobile = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Handle notification toggle
  const handleNotificationToggle = async () => {
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
    } else {
      await requestNotificationPermission();
    }
  };

  // Add this function to handle private message sending
  const sendPrivateMessage = async (e) => {
    e.preventDefault();
    
    if (!user || !input.trim() || !selectedChat) return;

    try {
      const messageData = {
        text: input.trim(),
        userId: user.uid,
        sender: user.displayName || 'Anonymous',
        timestamp: serverTimestamp(),
        email: user.email,
        createdAt: new Date().toISOString(),
        receiverId: selectedChat.uid,
        isPrivate: true
      };

      // Save to Firestore in a private messages collection
      const docRef = await addDoc(collection(db, 'private_messages'), messageData);
      console.log('Private message saved with ID:', docRef.id);

      // Emit socket event for private message
      socket.emit('private_message', {
        ...messageData,
        id: docRef.id,
        timestamp: new Date().toISOString()
      });

      setInput('');
    } catch (error) {
      console.error('Error sending private message:', error);
      alert('Failed to send private message. Please try again.');
    }
  };

  // Add this function to handle chat selection
  const handleChatSelect = (chatUser) => {
    setSelectedChat(chatUser);
    setSidebarOpen(false);
    
    // Load private messages for this chat
    const chatId = [user.uid, chatUser.uid].sort().join('_');
    if (!privateMessages[chatId]) {
      loadPrivateMessages(chatId);
    }
    
    // Add to active chats if not already present
    if (!activeChats.find(chat => chat.uid === chatUser.uid)) {
      setActiveChats(prev => [...prev, chatUser]);
    }
  };

  // Add this function to load private messages
  const loadPrivateMessages = async (chatId) => {
    try {
      const [user1, user2] = chatId.split('_');
      const messagesRef = collection(db, 'private_messages');
      const q = query(
        messagesRef,
        orderBy('timestamp', 'desc'),
        limit(50)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate?.() || new Date(doc.data().createdAt || Date.now())
          }))
          .filter(msg => 
            (msg.userId === user1 && msg.receiverId === user2) ||
            (msg.userId === user2 && msg.receiverId === user1)
          )
          .sort((a, b) => a.timestamp - b.timestamp);

        setPrivateMessages(prev => ({
          ...prev,
          [chatId]: messages
        }));
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error loading private messages:', error);
    }
  };

  // Add socket event listener for private messages
  useEffect(() => {
    socket.on('private_message', (data) => {
      if (data.userId === user?.uid || data.receiverId === user?.uid) {
        const chatId = [data.userId, data.receiverId].sort().join('_');
        setPrivateMessages(prev => ({
          ...prev,
          [chatId]: [...(prev[chatId] || []), data]
        }));

        // Show notification for incoming private messages
        if (data.userId !== user?.uid && !windowFocused) {
          showNotification({
            ...data,
            text: `${data.sender}: ${data.text}`,
            isPrivate: true
          });
        }
      }
    });

    return () => socket.off('private_message');
  }, [user, windowFocused, showNotification]);

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
      <Box sx={{ display: 'flex', height: '100vh', position: 'relative' }}>
        <SidebarWrapper className={sidebarOpen ? 'open' : ''}>
          {isMobile && (
            <Box sx={{ 
              position: 'absolute', 
              right: 8, 
              top: 8, 
              zIndex: 1
            }}>
              <IconButton onClick={toggleSidebar} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          )}
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

          {/* Online Users - Updated for private chat */}
          <List sx={{ flex: 1, overflow: 'auto', py: 0 }}>
            {onlineUsers.map((chatUser, index) => (
              <ListItemButton
                key={index}
                selected={selectedChat?.uid === chatUser.uid}
                onClick={() => handleChatSelect(chatUser)}
                sx={{
                  py: 1.5,
                  px: 2,
                  borderRadius: 2,
                  mx: 1,
                  mb: 0.5,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
                    transform: 'translateX(4px)'
                  },
                  '&.Mui-selected': {
                    backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.15),
                    '&:hover': {
                      backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.25),
                    }
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
                    <Avatar
                      sx={{ 
                        width: 40, 
                        height: 40,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        border: '2px solid',
                        borderColor: 'primary.main'
                      }}
                    >
                      {chatUser.name[0].toUpperCase()}
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primary={chatUser.name}
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
              <Tooltip title={notificationsEnabled ? "Disable Notifications" : "Enable Notifications"}>
                <ActionButton 
                  onClick={handleNotificationToggle}
                  sx={{
                    color: notificationsEnabled ? 'success.main' : 'inherit',
                    '&:hover': {
                      backgroundColor: (theme) => alpha(
                        notificationsEnabled ? theme.palette.success.main : theme.palette.primary.main, 
                        0.1
                      )
                    }
                  }}
                >
                  <NotificationsIcon />
                </ActionButton>
              </Tooltip>
            </Box>
          </Box>
        </SidebarWrapper>

        <ChatWrapper>
          {/* Chat Header - Updated for private chat */}
          <Box sx={{ 
            p: { xs: 1.5, sm: 2 }, 
            borderBottom: '1px solid',
            borderColor: (theme) => alpha(theme.palette.divider, 0.1),
            backgroundColor: (theme) => alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.8 : 0.95),
            backdropFilter: 'blur(20px)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {isMobile && (
                <IconButton onClick={toggleSidebar} size="small">
                  <MenuIcon />
                </IconButton>
              )}
              {selectedChat ? (
                <>
                  {!isMobile && (
                    <IconButton onClick={() => setSelectedChat(null)} size="small">
                      <ArrowBackIcon />
                    </IconButton>
                  )}
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {selectedChat.name[0].toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="500">
                      {selectedChat.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Online
                    </Typography>
                  </Box>
                </>
              ) : (
                <>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>G</Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="500">
                      {process.env.REACT_APP_APP_NAME}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {onlineUsers.length} online
                    </Typography>
                  </Box>
                </>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {selectedChat && !isMobile && (
                <>
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
                </>
              )}
            </Box>
          </Box>

          {/* Messages - Updated for private chat */}
          <Box sx={{ 
            flex: 1, 
            overflow: 'auto', 
            p: { xs: 1.5, sm: 2, md: 3 },
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            '&::-webkit-scrollbar': {
              width: '8px',
              backgroundColor: 'transparent'
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.2),
              borderRadius: '4px',
              '&:hover': {
                backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.3)
              }
            }
          }}>
            {selectedChat ? (
              // Private chat messages
              privateMessages[
                [user.uid, selectedChat.uid].sort().join('_')
              ]?.map((msg, index) => {
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
              })
            ) : (
              // Group chat messages
              messages.map((msg, index) => {
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
              })
            )}
            {isTyping && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
                <CircularProgress size={16} />
                <Typography variant="caption" color="text.secondary">
                  Someone is typing...
                </Typography>
              </Box>
            )}
          </Box>

          {/* Message Input - Updated for private chat */}
          <Box sx={{ 
            p: { xs: 1.5, sm: 2 },
            borderTop: '1px solid',
            borderColor: (theme) => alpha(theme.palette.divider, 0.1),
            backgroundColor: (theme) => alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.8 : 0.95),
            backdropFilter: 'blur(10px)',
            boxShadow: '0 -4px 16px rgba(0,0,0,0.1)'
          }}>
            <form onSubmit={selectedChat ? sendPrivateMessage : sendMessage}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                {!isMobile && (
                  <Tooltip title="Attach File">
                    <ActionButton size="small">
                      <AttachFileIcon />
                    </ActionButton>
                  </Tooltip>
                )}
                <StyledInput
                  fullWidth
                  placeholder={selectedChat ? `Message ${selectedChat.name}...` : "Type a message..."}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    socket.emit('typing', { 
                      isTyping: e.target.value.length > 0,
                      receiverId: selectedChat?.uid
                    });
                  }}
                  size="small"
                />
                {!isMobile && (
                  <>
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
                  </>
                )}
                <Tooltip title="Send">
                  <span>
                    <ActionButton 
                      type="submit" 
                      size="small"
                      disabled={!input.trim()}
                      sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'primary.dark',
                          transform: 'scale(1.05)'
                        },
                        '&:active': {
                          transform: 'scale(0.95)'
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
