import '../styles/RegisterPage.css';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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

    // Coach specific
    experience: '',
    specializations: [],
    bio: '',
    title: 'None',

    // Student specific
    skillLevel: 'Beginner',
    learningGoals: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSpecializationChange = (e) => {
    const specs = e.target.value.split(',').map(s => s.trim());
    setFormData({
      ...formData,
      specializations: specs
    });
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

    // Coach-specific submit fixes
    if (role === 'coach') {
      submitData.experience = Number(formData.experience);
      // Removed: submitData.hourlyRate
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

  // STEP 1 — Select Role
  if (step === 1) {
    return (
      <div className="register-role-container">
        <div className="register-card">

          <h2 className="register-title">Join ChessMaster Academy</h2>
          <p className="register-subtitle">Choose your role to get started</p>

          <div className="role-options">
            <div className="role-option" onClick={() => handleRoleSelect('student')}>
              <span className="role-icon">🎓</span>
              <h3>I’m a Student</h3>
              <p>I want to learn chess from expert coaches</p>
            </div>

            <div className="role-option" onClick={() => handleRoleSelect('coach')}>
              <span className="role-icon">🧑‍🏫</span>
              <h3>I’m a Coach</h3>
              <p>I want to teach chess and share my expertise</p>
            </div>
          </div>

          <p className="register-footer">
            Already have an account? <Link to="/login">Sign in here</Link>
          </p>

        </div>
      </div>
    );
  }

  // STEP 2 — Registration Form
  return (
    <div className="register-wrapper">
      <div className="register-card">

        <button onClick={() => setStep(1)} className="back-button">← Back</button>

        <h2>Create Your {role === "coach" ? "Coach" : "Student"} Account</h2>
        <p className="register-subtitle">Fill in your details to get started</p>

        {error && <p className="alert-error">{error}</p>}

        <form onSubmit={handleSubmit}>

          {/* Basic Info */}
          <h3>Basic Information</h3>
          <div className="form-grid-2">
            <div className="form-group">
              <label>Full Name *</label>
              <input type="text" name="name" onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input type="email" name="email" onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Password *</label>
              <input type="password" name="password" onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Age *</label>
              <input type="number" name="age" onChange={handleChange} min="5" max="120" required />
            </div>

            <div className="form-group">
              <label>Country</label>
              <input type="text" name="country" onChange={handleChange} />
            </div>
          </div>

          {/* Chess Info */}
          <h3>Chess Information</h3>
          <div className="form-grid-2">
            <div className="form-group">
              <label>Chess Rating *</label>
              <input type="number" name="chessRating" onChange={handleChange} min="0" max="4000" required />
            </div>

            <div className="form-group">
              <label>Rating Type *</label>
              <select name="ratingType" onChange={handleChange}>
                <option>Lichess</option>
                <option>Chess.com</option>
                <option>FIDE</option>
                <option>National</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          {/* Coach Fields */}
          {role === "coach" && (
            <>
              <h3>Coach Details</h3>

              <div className="form-group">
                <label>Years of Experience *</label>
                <input name="experience" onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label>Specializations (comma separated)</label>
                <input name="specializations" onChange={handleSpecializationChange} />
              </div>

              <div className="form-group">
                <label>Bio</label>
                <textarea name="bio" onChange={handleChange}></textarea>
              </div>
            </>
          )}

          {/* Student Fields */}
          {role === "student" && (
            <>
              <h3>Learning Preferences</h3>

              <div className="form-group">
                <label>Skill Level</label>
                <select name="skillLevel" onChange={handleChange}>
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                  <option>Expert</option>
                </select>
              </div>

              <div className="form-group">
                <label>Learning Goals</label>
                <textarea name="learningGoals" onChange={handleChange}></textarea>
              </div>
            </>
          )}

          <button type="submit" className="btn-submit">
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <p className="link-text">Already have an account? <Link to="/login">Sign in here</Link></p>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;