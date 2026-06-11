import React, { useState, useEffect } from 'react';

import { useSocket } from '../context/SocketContext';
import { gameAPI } from '../utils/api';
import '../styles/PlayPage.css';

export default function FriendsPage() {
  const { emit, on, off } = useSocket();
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [tab, setTab] = useState('friends');

  useEffect(() => {
    loadFriends();
    loadRequests();
  }, []);

  useEffect(() => {
    const handler = (data) => {
      if (window.confirm(`${data.fromName} challenges you to a game!`)) {
        emit('friend:challenge-response', {
          accept: true,
          to: data.from,
          timeControl: data.timeControl,
          rated: data.rated,
          category: data.timeControl?.initial <= 2 ? 'bullet' : data.timeControl?.initial <= 8 ? 'blitz' : 'rapid'
        });
      } else {
        emit('friend:challenge-response', { accept: false, to: data.from });
      }
    };
    on('friend:challenged', handler);
    const declined = (data) => { console.log('Challenge declined:', data?.reason || ''); };
    on('friend:challenge-declined', declined);
    return () => { off('friend:challenged'); off('friend:challenge-declined'); };
  }, [on, off, emit]);

  async function loadFriends() {
    try {
      const res = await gameAPI.getFriends();
      setFriends(res.data.friends || []);
    } catch (e) { console.error(e); }
  }

  async function loadRequests() {
    try {
      const res = await gameAPI.getFriendRequests();
      setRequests(res.data.requests || []);
    } catch (e) { console.error(e); }
  }

  async function handleSearch(q) {
    setSearch(q);
    if (q.length < 2) return setSearchResults([]);
    try {
      const res = await gameAPI.searchUsers(q);
      setSearchResults(res.data.users || []);
    } catch (e) { console.error(e); }
  }

  async function sendRequest(id) {
    try { await gameAPI.sendFriendRequest(id); alert('Request sent!'); } catch (e) { alert(e.response?.data?.message); }
  }

  async function acceptRequest(id) {
    try { await gameAPI.acceptFriendRequest(id); loadRequests(); loadFriends(); } catch (e) {}
  }

  async function rejectRequest(id) {
    try { await gameAPI.rejectFriendRequest(id); loadRequests(); } catch (e) {}
  }

  async function removeFriend(id) {
    if (!window.confirm('Remove friend?')) return;
    try { await gameAPI.removeFriend(id); loadFriends(); } catch (e) {}
  }

  function challengeFriend(friendId) {
    emit('friend:challenge', {
      recipientId: friendId,
      timeControl: { initial: 5, increment: 3 },
      rated: true
    });
    alert('Challenge sent!');
  }

  return (
    <div className="play-page">
      <div className="play-tabs" style={{ marginBottom: 20 }}>
        <button className={`play-tab ${tab === 'friends' ? 'active' : ''}`} onClick={() => setTab('friends')}>Friends ({friends.length})</button>
        <button className={`play-tab ${tab === 'requests' ? 'active' : ''}`} onClick={() => setTab('requests')}>Requests ({requests.length})</button>
        <button className={`play-tab ${tab === 'search' ? 'active' : ''}`} onClick={() => setTab('search')}>Add Friend</button>
      </div>

      {tab === 'friends' && (
        <div>
          {friends.map(f => (
            <div key={f._id} className="friend-card">
              <div className="friend-avatar">{f.user?.name?.[0] || '?'}</div>
              <div className="friend-info">
                <strong>{f.user?.name}</strong>
                <span>Rating: {f.user?.chessRating || '—'}</span>
              </div>
              <button className="play-watch-btn" onClick={() => challengeFriend(f.user?._id)}>Challenge</button>
              <button className="game-action-btn abort" onClick={() => removeFriend(f._id)}>Remove</button>
            </div>
          ))}
          {friends.length === 0 && <p>No friends yet. Search for users to add!</p>}
        </div>
      )}

      {tab === 'requests' && (
        <div>
          {requests.map(r => (
            <div key={r._id} className="friend-card">
              <div className="friend-avatar">{r.requester?.name?.[0] || '?'}</div>
              <div className="friend-info">
                <strong>{r.requester?.name}</strong>
                <span>Rating: {r.requester?.chessRating || '—'}</span>
              </div>
              <button className="play-watch-btn" onClick={() => acceptRequest(r._id)}>Accept</button>
              <button className="game-action-btn abort" onClick={() => rejectRequest(r._id)}>Reject</button>
            </div>
          ))}
          {requests.length === 0 && <p>No pending requests</p>}
        </div>
      )}

      {tab === 'search' && (
        <div>
          <input className="play-search-input" placeholder="Search by username..." value={search} onChange={e => handleSearch(e.target.value)} />
          {searchResults.map(u => (
            <div key={u._id} className="friend-card">
              <div className="friend-avatar">{u.name?.[0] || '?'}</div>
              <div className="friend-info">
                <strong>{u.name}</strong>
                <span>Rating: {u.chessRating || '—'}</span>
              </div>
              <button className="play-watch-btn" onClick={() => sendRequest(u._id)}>Add Friend</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
