import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { userAPI } from "../utils/api";
import "../styles/ProfilePage.css";

const ProfilePage = () => {
  const { user, updateUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    age: user?.age || "",
    country: user?.country || "",
    chessRating: user?.chessRating || "",
    ratingType: user?.ratingType || "Chess.com",

    // Coach-only fields (hourlyRate removed)
    experience: user?.experience || "",
    specializations: user?.specializations?.join(", ") || "",
    bio: user?.bio || "",

    // Student-only fields
    skillLevel: user?.skillLevel || "Beginner",
    learningGoals: user?.learningGoals || "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const updateData = {
        ...formData,
        age: Number(formData.age),
        chessRating: Number(formData.chessRating),
      };

      if (user.role === "coach") {
        updateData.experience = Number(formData.experience);
        updateData.specializations = formData.specializations
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s);
      }

      const { data } = await userAPI.updateProfile(updateData);
      updateUser(data.user);

      setMessage("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-container">

      {/* HEADER CARD */}
      <div className="profile-header-card">
        <div className="profile-left">
          <div className="avatar-circle">
            {user?.name?.charAt(0)}
          </div>

          <div>
            <h2 className="profile-name">{user?.name}</h2>
            <p className="profile-email">{user?.email}</p>

            <span className={`role-badge ${user?.role}`}>
              {user?.role === "coach" ? "Coach" : "Student"}
            </span>
          </div>
        </div>

        {!isEditing && (
          <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
            Edit Profile
          </button>
        )}
      </div>

      {message && <p className="profile-message">{message}</p>}

      {/* ============================ VIEW MODE ============================ */}
      {!isEditing ? (
        <div className="profile-grid">

          {/* BASIC CARD */}
          <div className="profile-card">
            <h3 className="card-title">Basic Information</h3>
            <div className="card-content">
              <p><strong>Name:</strong> {user?.name}</p>
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Age:</strong> {user?.age}</p>
              <p><strong>Country:</strong> {user?.country || "Not set"}</p>
            </div>
          </div>

          {/* CHESS CARD */}
          <div className="profile-card">
            <h3 className="card-title">Chess Information</h3>
            <div className="card-content">
              <p><strong>Rating:</strong> {user?.chessRating}</p>
              <p><strong>Rating Type:</strong> {user?.ratingType}</p>
              <p><strong>Total Sessions:</strong> {user?.totalSessions || 0}</p>
            </div>
          </div>

          {/* STUDENT CARD */}
          {user?.role === "student" && (
            <div className="profile-card">
              <h3 className="card-title">Learning Preferences</h3>
              <div className="card-content">
                <p><strong>Skill Level:</strong> {user?.skillLevel}</p>
                <p><strong>Goals:</strong> {user?.learningGoals || "Not set"}</p>
              </div>
            </div>
          )}

          {/* COACH CARD */}
          {user?.role === "coach" && (
            <div className="profile-card">
              <h3 className="card-title">Coaching Details</h3>
              <div className="card-content">
                <p><strong>Experience:</strong> {user?.experience} years</p>

                {user?.bio && (
                  <p><strong>Bio:</strong> {user.bio}</p>
                )}

                {user?.specializations?.length > 0 && (
                  <p>
                    <strong>Specializations:</strong>
                    <br />
                    {user.specializations.map((spec, i) => (
                      <span key={i} className="spec-tag">{spec}</span>
                    ))}
                  </p>
                )}
              </div>
            </div>
          )}

        </div>

      ) : (
      /* ============================ EDIT MODE ============================ */

        <form className="profile-edit-form" onSubmit={handleSubmit}>

          {/* BASIC */}
          <div className="profile-card">
            <h3 className="card-title">Basic Information</h3>

            <label>Name</label>
            <input name="name" value={formData.name} onChange={handleChange} />

            <label>Age</label>
            <input type="number" name="age" value={formData.age} onChange={handleChange} />

            <label>Country</label>
            <input name="country" value={formData.country} onChange={handleChange} />
          </div>

          {/* CHESS */}
          <div className="profile-card">
            <h3 className="card-title">Chess Information</h3>

            <label>Rating</label>
            <input
              type="number"
              name="chessRating"
              value={formData.chessRating}
              onChange={handleChange}
            />

            <label>Rating Type</label>
            <select name="ratingType" value={formData.ratingType} onChange={handleChange}>
              <option>Lichess</option>
              <option>Chess.com</option>
              <option>FIDE</option>
              <option>National</option>
              <option>Other</option>
            </select>
          </div>

          {/* COACH EDIT */}
          {user.role === "coach" && (
            <div className="profile-card">
              <h3 className="card-title">Coach Details</h3>

              <label>Experience (years)</label>
              <input
                type="number"
                name="experience"
                value={formData.experience}
                onChange={handleChange}
              />

              <label>Specializations (comma separated)</label>
              <input
                name="specializations"
                value={formData.specializations}
                onChange={handleChange}
              />

              <label>Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
              />
            </div>
          )}

          {/* STUDENT EDIT */}
          {user.role === "student" && (
            <div className="profile-card">
              <h3 className="card-title">Learning Preferences</h3>

              <label>Skill Level</label>
              <select
                name="skillLevel"
                value={formData.skillLevel}
                onChange={handleChange}
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
                <option>Expert</option>
              </select>

              <label>Goals</label>
              <textarea
                name="learningGoals"
                value={formData.learningGoals}
                onChange={handleChange}
              />
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="edit-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>

            <button type="submit" className="btn-save">
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>

        </form>
      )}
    </div>
  );
};

export default ProfilePage;