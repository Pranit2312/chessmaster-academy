import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

const API_URL = process.env.REACT_APP_API_URL || '/api';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || (API_URL === '/api' ? 'http://localhost:5005' : API_URL.replace('/api', ''));

export function SocketProvider({ children }) {
  const { token, logout } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [queueSizes, setQueueSizes] = useState({});
  const listenersRef = useRef(new Map());
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const logoutRef = useRef(logout);
  const connectingRef = useRef(false);
  const tokenRef = useRef(token);
  tokenRef.current = token;
  logoutRef.current = logout;

  const createSocket = useCallback((authToken) => {
    if (socketRef.current?.connected) return;
    if (!authToken) return;
    if (connectingRef.current) return;
    connectingRef.current = true;

    const socket = io(SOCKET_URL, {
      auth: { token: authToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000
    });
    socketRef.current = socket;
    retryCountRef.current = 0;

    socket.on('connect', () => {
      setConnected(true);
      setConnectionError(null);
      retryCountRef.current = 0;
      connectingRef.current = false;
    });

    socket.on('disconnect', (reason) => {
      setConnected(false);
      if (reason === 'io server disconnect' || reason === 'io client disconnect') return;
    });

    socket.on('connect_error', (err) => {
      retryCountRef.current++;
      const msg = err.message || 'Connection failed';
      if (msg.includes('Authentication required') || msg.includes('Invalid token')) {
        setConnectionError('Authentication failed. Please log in again.');
        if (retryCountRef.current >= maxRetries) {
          socket.close();
          logoutRef.current();
        }
      } else if (msg.includes('xhr poll error')) {
        setConnectionError('Cannot reach game server. Retrying...');
      } else {
        setConnectionError(`${msg} (attempt ${retryCountRef.current})`);
      }
    });

    socket.on('users:online', (data) => setOnlineUsers(data.users || []));
    socket.on('queue:sizes', (data) => setQueueSizes(data || {}));
  }, []);

  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setConnected(false);
      setConnectionError(null);
      connectingRef.current = false;
      return;
    }
    // Use a microtask to avoid StrictMode double-connect:
    // In StrictMode, the cleanup runs and then the effect runs again.
    // By delaying with requestAnimationFrame, we let the second mount happen
    // before creating the socket, so the first cleanup closes a null socket.
    const raf = requestAnimationFrame(() => {
      createSocket(token);
    });
    return () => {
      cancelAnimationFrame(raf);
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
        setConnected(false);
        connectingRef.current = false;
      }
    };
  }, [token, createSocket]);

  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const on = useCallback((event, handler) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler);
      listenersRef.current.set(event, handler);
    }
  }, []);

  const off = useCallback((event) => {
    if (socketRef.current) {
      socketRef.current.off(event);
      listenersRef.current.delete(event);
    }
  }, []);

  const waitForConnection = useCallback((timeoutMs = 5000) => {
    return new Promise((resolve) => {
      if (socketRef.current?.connected) return resolve(true);
      const timeout = setTimeout(() => resolve(false), timeoutMs);
      const check = () => {
        if (socketRef.current?.connected) {
          clearTimeout(timeout);
          resolve(true);
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, connectionError, onlineUsers, queueSizes, emit, on, off, waitForConnection }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
