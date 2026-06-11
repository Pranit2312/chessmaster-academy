import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { forumAPI } from '../utils/api';
import '../styles/TournamentsPage.css';

export default function ForumDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [discussion, setDiscussion] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');

  const loadDiscussion = useCallback(async () => {
    try {
      const res = await forumAPI.getDiscussion(id);
      setDiscussion(res.data.discussion);
      setReplies(res.data.replies || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [id]);

  useEffect(() => { loadDiscussion(); }, [loadDiscussion]);

  async function handleReply(e) {
    e.preventDefault();
    try {
      await forumAPI.createReply(id, { content: replyContent });
      setReplyContent('');
      loadDiscussion();
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  }

  async function handleLike() {
    try { await forumAPI.likeDiscussion(id); loadDiscussion(); }
    catch (e) { console.error(e); }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this discussion?')) return;
    try { await forumAPI.deleteDiscussion(id); navigate('/forum'); }
    catch (e) { alert(e.response?.data?.message); }
  }

  if (loading) return <div className="tournament-detail"><p>Loading...</p></div>;
  if (!discussion) return <div className="tournament-detail"><p>Discussion not found</p></div>;

  return (
    <div className="tournament-detail forum-detail">
      <div className="td-header">
        <div>
          <h1>{discussion.isPinned && '📌 '}{discussion.title}</h1>
          <div className="td-meta">
            <span>By {discussion.author?.name} ({discussion.author?.role})</span>
            <span className="forum-category">{discussion.category}</span>
            <span>👁 {discussion.viewCount} views</span>
            <span>❤️ {discussion.likesCount}</span>
            <span>{new Date(discussion.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="td-actions">
          <button className="tp-btn tp-btn-secondary" onClick={handleLike}>Like</button>
          {(discussion.author?._id === user?._id || user?.role === 'admin') && (
            <button className="tp-btn tp-btn-danger" onClick={handleDelete}>Delete</button>
          )}
        </div>
      </div>

      <div className="forum-post-body">
        <p>{discussion.content}</p>
      </div>

      <div className="td-section">
        <h3>Replies ({replies.length})</h3>
        {replies.map(r => (
          <div key={r._id} className={`forum-reply ${r.isMarkedAsSolution ? 'forum-solution' : ''}`}>
            <div className="forum-reply-header">
              <strong>{r.author?.name}</strong>
              <span className="forum-category">{r.author?.role}</span>
              <span>{new Date(r.createdAt).toLocaleDateString()}</span>
              {r.isMarkedAsSolution && <span className="forum-solution-badge">✓ Solution</span>}
            </div>
            <p>{r.content}</p>
          </div>
        ))}
        {replies.length === 0 && <p>No replies yet.</p>}

        <form className="td-reply-form" onSubmit={handleReply}>
          <textarea placeholder="Write a reply..." value={replyContent} onChange={e => setReplyContent(e.target.value)} rows={3} required />
          <button type="submit" className="tp-btn tp-btn-primary">Reply</button>
        </form>
      </div>
    </div>
  );
}
