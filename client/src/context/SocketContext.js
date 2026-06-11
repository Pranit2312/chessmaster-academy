import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

const API_URL = process.env.REACT_APP_API_URL || '/api';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || (API_URL === '/api' ? 'http://localhost:5005' : API_URL.replace('/api', ''));

export function SocketProvider({ children }) {
  const { token } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [queueSizes, setQueueSizes] = useState({});
  const listenersRef = useRef(new Map());

  useEffect(() => {
    if (!token) return;
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('users:online', (data) => setOnlineUsers(data.users || []));
    socket.on('queue:sizes', (data) => setQueueSizes(data || {}));

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  const emit = (event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  };

  const on = (event, handler) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler);
      listenersRef.current.set(event, handler);
    }
  };

  const off = (event) => {
    if (socketRef.current) {
      socketRef.current.off(event);
      listenersRef.current.delete(event);
    }
  };

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, onlineUsers, queueSizes, emit, on, off }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
