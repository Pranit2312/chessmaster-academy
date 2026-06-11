import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { forumAPI } from '../utils/api';
import '../styles/TournamentsPage.css';

const CATEGORIES = ['', 'Technical', 'Conceptual', 'Resource', 'Off-Topic', 'Announcement'];

export default function ForumPage() {
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: 'Conceptual' });

  const loadDiscussions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await forumAPI.getDiscussions({ params: { category: category || undefined, search: search || undefined } });
      setDiscussions(res.data.discussions || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [category, search]);

  useEffect(() => { loadDiscussions(); }, [loadDiscussions]);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await forumAPI.createDiscussion(form);
      setShowCreate(false);
      setForm({ title: '', content: '', category: 'Conceptual' });
      loadDiscussions();
    } catch (err) { alert(err.response?.data?.message || 'Failed to create'); }
  }

  return (
    <div className="tournaments-page">
      <div className="tp-header">
        <h1>Community Forum</h1>
        <button className="tp-create-btn" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancel' : 'New Discussion'}
        </button>
      </div>

      {showCreate && (
        <form className="td-create-form" onSubmit={handleCreate}>
          <input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <textarea placeholder="Content..." value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={5} required />
          <button type="submit" className="tp-btn tp-btn-primary">Post</button>
        </form>
      )}

      <div className="tp-filters" style={{ marginBottom: 16 }}>
        <select value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.filter(Boolean).map(c => <option key={c}>{c}</option>)}
        </select>
        <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        <button onClick={loadDiscussions} className="tp-filter-btn">Search</button>
      </div>

      {loading ? <p>Loading...</p> : (
        <div className="forum-list">
          {discussions.map(d => (
            <Link to={`/forum/${d._id}`} key={d._id} className="forum-card">
              <div className="forum-card-main">
                <h3>{d.isPinned && '📌 '}{d.title}</h3>
                <p className="forum-card-excerpt">{d.content?.slice(0, 150)}...</p>
                <div className="forum-card-meta">
                  <span>By {d.author?.name}</span>
                  <span className="forum-category">{d.category}</span>
                  <span>💬 {d.repliesCount}</span>
                  <span>👁 {d.viewCount}</span>
                  <span>❤️ {d.likesCount}</span>
                  <span>{new Date(d.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}
          {discussions.length === 0 && <p style={{ padding: 20 }}>No discussions yet. Start one!</p>}
        </div>
      )}
    </div>
  );
}
