import React, { useState, useCallback, useEffect } from 'react';
import { aiAPI } from '../utils/api';
import ChatInterface from '../components/ChatInterface';
import '../styles/AiPages.css';

const AiCoachPage = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [chats, setChats] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const initialized = React.useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      (async () => {
        try {
          const res = await aiAPI.getChatHistory();
          setChats(res.data.chats || []);
        } catch {}
      })();
    }
  }, []);

  const loadChatHistory = useCallback(async () => {
    try {
      const res = await aiAPI.getChatHistory();
      setChats(res.data.chats || []);
    } catch {}
  }, []);

  const handleSend = useCallback(async (message) => {
    setLoading(true);
    setError(null);
    try {
      const res = await aiAPI.sendChatMessage({ message, chatId });
      setChatId(res.data?.chat?._id || chatId);
      setMessages(prev => [
        ...prev,
        { role: 'user', content: message, timestamp: new Date() },
        { role: 'assistant', content: res.data.response, timestamp: new Date() }
      ]);
      loadChatHistory();
    } catch (err) {
      setError('Failed to send message. Please try again.');
    }
    setLoading(false);
  }, [chatId, loadChatHistory]);

  const loadChat = useCallback(async (id) => {
    setLoading(true);
    try {
      const res = await aiAPI.getChatById(id);
      setChatId(res.data?.chat?._id || null);
      const history = res.data.chat.messages?.filter(m => m.role !== 'system') || [];
      setMessages(history);
      setShowHistory(false);
    } catch {}
    setLoading(false);
  }, []);

  const newChat = useCallback(() => {
    setChatId(null);
    setMessages([]);
    setError(null);
  }, []);

  return (
    <div className="ai-page">
      <div className="ai-page-header">
        <h1>💬 AI Coach Assistant</h1>
        <p>Your personal chess coach — ask anything about chess</p>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={newChat}>New Chat</button>
          <button className="btn btn-outline" onClick={() => setShowHistory(!showHistory)}>
            {showHistory ? 'Hide History' : 'Chat History'}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="ai-coach-layout">
        {showHistory && (
          <div className="chat-history-sidebar">
            <h3>Previous Chats</h3>
            {chats.length === 0 && <p className="text-muted">No previous chats</p>}
            {chats.map(chat => (
              <div key={chat._id} className="chat-history-item" onClick={() => loadChat(chat._id)}>
                <div className="chat-history-title">{chat.title}</div>
                <div className="chat-history-meta">
                  <span>{chat.messageCount} messages</span>
                  <span>{new Date(chat.lastActivity).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="chat-main">
          <ChatInterface
            messages={messages}
            onSend={handleSend}
            loading={loading}
            placeholder="Ask your AI chess coach anything..."
          />
        </div>
      </div>
    </div>
  );
};

export default AiCoachPage;
