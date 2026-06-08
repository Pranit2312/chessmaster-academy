import React, { useState, useRef, useEffect } from 'react';

const ChatInterface = ({ messages, onSend, loading, placeholder }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    onSend(input.trim());
    setInput('');
  };

  return (
    <div className="chat-interface">
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            <div className="chat-empty-icon">💬</div>
            <h3>AI Chess Coach</h3>
            <p>Ask me anything about chess! Try questions like:</p>
            <div className="chat-suggestions">
              <button className="suggestion-btn" onClick={() => onSend('Recommend an opening for me')}>
                Recommend an opening
              </button>
              <button className="suggestion-btn" onClick={() => onSend('Give me tactical tips')}>
                Tactical tips
              </button>
              <button className="suggestion-btn" onClick={() => onSend('How to improve?')}>
                How to improve?
              </button>
              <button className="suggestion-btn" onClick={() => onSend('Endgame tips')}>
                Endgame tips
              </button>
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`chat-message chat-message-${msg.role}`}>
            <div className="chat-avatar">
              {msg.role === 'assistant' ? '🤖' : msg.role === 'system' ? '⚙️' : '👤'}
            </div>
            <div className="chat-bubble">
              <div className="chat-bubble-content">{msg.content}</div>
              <div className="chat-time">
                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="chat-message chat-message-assistant">
            <div className="chat-avatar">🤖</div>
            <div className="chat-bubble">
              <div className="chat-typing">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder || 'Ask your AI chess coach...'}
          disabled={loading}
        />
        <button type="submit" className="chat-send-btn" disabled={loading || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;
