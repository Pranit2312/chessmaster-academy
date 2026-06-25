import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/RegisterPage.css';
import '../styles/AuthPages.css';

const RegisterPage = () => {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    age: '',
    chessRating: '',
    ratingType: 'Chess.com',
    country: '',
    timezone: 'Asia/Kolkata',
    experience: '',
    specializations: [],
    bio: '',
    title: 'None',
    skillLevel: 'Beginner',
    learningGoals: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSpecializationChange = (e) => {
    const specs = e.target.value.split(',').map(s => s.trim());
    setFormData({ ...formData, specializations: specs });
  };

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const submitData = {
      ...formData,
      role,
      age: Number(formData.age),
      chessRating: Number(formData.chessRating)
    };

    if (role === 'coach') {
      submitData.experience = Number(formData.experience);
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    const result = await register(submitData);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  if (step === 1) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-brand">
            <span className="brand-icon">♟</span>
            <span className="brand-text">ChessMaster</span>
          </div>

          <div className="auth-header">
            <h1>Join ChessMaster Academy</h1>
            <p>Choose your role to get started</p>
          </div>

          <div className="role-options">
            <div className={`role-card ${role === 'student' ? 'selected' : ''}`} onClick={() => handleRoleSelect('student')}>
              <div className="role-icon">🎓</div>
              <h3>I'm a Student</h3>
              <p>Learn chess from expert coaches</p>
            </div>
            <div className={`role-card ${role === 'coach' ? 'selected' : ''}`} onClick={() => handleRoleSelect('coach')}>
              <div className="role-icon">🧑‍🏫</div>
              <h3>I'm a Coach</h3>
              <p>Teach chess and share your expertise</p>
            </div>
          </div>

          <p className="auth-footer">
            Already have an account? <Link to="/login">Sign in here</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <button onClick={() => setStep(1)} className="auth-back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back to role selection
        </button>

        <div className="auth-header">
          <h1>Create your {role} account</h1>
          <p>Fill in your details to get started</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <h3>Basic Information</h3>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input type="text" name="name" className="form-input" onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input type="email" name="email" className="form-input" onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input type="password" name="password" className="form-input" onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Age *</label>
              <input type="number" name="age" className="form-input" onChange={handleChange} min="5" max="120" required />
            </div>
            <div className="form-group">
              <label className="form-label">Country</label>
              <input type="text" name="country" className="form-input" onChange={handleChange} />
            </div>
          </div>

          <h3>Chess Information</h3>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Chess Rating *</label>
              <input type="number" name="chessRating" className="form-input" onChange={handleChange} min="0" max="4000" required />
            </div>
            <div className="form-group">
              <label className="form-label">Rating Type *</label>
              <select name="ratingType" className="form-select" onChange={handleChange}>
                <option>Lichess</option>
                <option>Chess.com</option>
                <option>FIDE</option>
                <option>National</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          {role === "coach" && (
            <>
              <h3>Coach Details</h3>
              <div className="form-group">
                <label className="form-label">Years of Experience *</label>
                <input name="experience" className="form-input" onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Specializations (comma separated)</label>
                <input name="specializations" className="form-input" onChange={handleSpecializationChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Bio</label>
                <textarea name="bio" className="form-textarea" onChange={handleChange}></textarea>
              </div>
            </>
          )}

          {role === "student" && (
            <>
              <h3>Learning Preferences</h3>
              <div className="form-group">
                <label className="form-label">Skill Level</label>
                <select name="skillLevel" className="form-select" onChange={handleChange}>
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                  <option>Expert</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Learning Goals</label>
                <textarea name="learningGoals" className="form-textarea" onChange={handleChange}></textarea>
              </div>
            </>
          )}

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in here</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
