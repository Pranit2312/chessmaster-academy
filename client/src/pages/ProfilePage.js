import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { userAPI } from "../utils/api";
import Modal from "../components/Modal";
import LoadingSpinner from "../components/LoadingSpinner";
import "../styles/ProfilePage.css";

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    city: "",
    chessRating: "",
    ratingType: "Chess.com",
    experience: "",
    specializations: "",
    bio: "",
    skillLevel: "Beginner",
    learningGoals: ""
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    if (user) {
      setProfile(user);
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        country: user.country || "",
        city: user.city || "",
        chessRating: user.chessRating || "",
        ratingType: user.ratingType || "Chess.com",
        experience: user.experience || "",
        specializations: Array.isArray(user.specializations)
          ? user.specializations.join(", ")
          : user.specializations || "",
        bio: user.bio || "",
        skillLevel: user.skillLevel || "Beginner",
        learningGoals: user.learningGoals || ""
      });
    }
    setLoading(false);
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        ...formData,
        specializations: formData.specializations
          .split(",")
          .map(s => s.trim())
          .filter(s => s)
      };

      await userAPI.updateProfile(updateData);
      updateUser(updateData);
      setMessage("Profile updated successfully!");
      setIsEditing(false);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("Failed to update profile");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    try {
      await userAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      setMessage("Password changed successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPasswordModal(false);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("Failed to change password");
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="profile-container">
      <header className="profile-header">
        <div className="profile-avatar">
          <img src={profile?.avatar || "/default-avatar.png"} alt="Profile" />
        </div>
        <div className="profile-info">
          <h2>{profile?.name}</h2>
          <p>{profile?.role === "coach" ? "Chess Coach" : "Student"}</p>
          <p className="email">{profile?.email}</p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-secondary"
            onClick={() => setShowPasswordModal(true)}
          >
            Change Password
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? "Cancel" : "Edit Profile"}
          </button>
        </div>
      </header>

      {message && <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>{message}</div>}

      {isEditing ? (
        <form onSubmit={handleSaveProfile} className="profile-form">
          <section className="form-section">
            <h3>Basic Information</h3>

            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
              />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>
            </div>
          </section>

          <section className="form-section">
            <h3>Chess Profile</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Chess Rating</label>
                <input
                  type="number"
                  name="chessRating"
                  value={formData.chessRating}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Rating Type</label>
                <select
                  name="ratingType"
                  value={formData.ratingType}
                  onChange={handleChange}
                >
                  <option>Chess.com</option>
                  <option>Lichess</option>
                  <option>FIDE</option>
                </select>
              </div>
            </div>
          </section>

          {profile?.role === "coach" ? (
            <section className="form-section">
              <h3>Coach Information</h3>

              <div className="form-group">
                <label>Experience (Years)</label>
                <input
                  type="number"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Specializations (comma-separated)</label>
                <input
                  type="text"
                  name="specializations"
                  value={formData.specializations}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="4"
                />
              </div>
            </section>
          ) : (
            <section className="form-section">
              <h3>Student Information</h3>

              <div className="form-group">
                <label>Skill Level</label>
                <select
                  name="skillLevel"
                  value={formData.skillLevel}
                  onChange={handleChange}
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>

              <div className="form-group">
                <label>Learning Goals</label>
                <textarea
                  name="learningGoals"
                  value={formData.learningGoals}
                  onChange={handleChange}
                  rows="4"
                />
              </div>
            </section>
          )}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Save Profile
            </button>
          </div>
        </form>
      ) : (
        <div className="profile-details">
          <section className="detail-section">
            <h3>Basic Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="label">Location</span>
                <span className="value">
                  {formData.city}, {formData.country}
                </span>
              </div>
              <div className="detail-item">
                <span className="label">Phone</span>
                <span className="value">{formData.phone || "Not provided"}</span>
              </div>
            </div>
          </section>

          <section className="detail-section">
            <h3>Chess Profile</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="label">Rating</span>
                <span className="value">
                  {formData.chessRating} ({formData.ratingType})
                </span>
              </div>
              {profile?.role === "student" && (
                <div className="detail-item">
                  <span className="label">Skill Level</span>
                  <span className="value">{formData.skillLevel}</span>
                </div>
              )}
            </div>
          </section>

          {profile?.role === "coach" ? (
            <section className="detail-section">
              <h3>Coach Information</h3>
              <div className="detail-item">
                <span className="label">Experience</span>
                <span className="value">{formData.experience} Years</span>
              </div>
              <div className="detail-item">
                <span className="label">Specializations</span>
                <span className="value">{formData.specializations}</span>
              </div>
              <div className="detail-item">
                <span className="label">Bio</span>
                <p className="bio-text">{formData.bio || "No bio provided"}</p>
              </div>
            </section>
          ) : (
            <section className="detail-section">
              <h3>Learning Goals</h3>
              <p className="goals-text">
                {formData.learningGoals || "No learning goals provided"}
              </p>
            </section>
          )}
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      <Modal
        open={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      >
        <div className="password-modal">
          <h3>Change Password</h3>
          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>

            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowPasswordModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Update Password
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default ProfilePage;