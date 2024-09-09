import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import NavbarCustom from '../NavbarCustom';
import './HomePage.css';
import { useNavigate } from 'react-router-dom';
import UserPost from '../Post';

// Function to calculate relative time
const getRelativeTime = (timestamp) => {
  const now = new Date();
  const timeDiff = now - new Date(timestamp);  // Difference in milliseconds

  const minutes = Math.floor(timeDiff / (1000 * 60));
  const hours = Math.floor(timeDiff / (1000 * 60 * 60));
  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

  if (minutes < 1) {
    return 'just now';
  } else if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  } else if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  } else {
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }
};

const HomePage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [postedRoutes, setPostedRoutes] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newBio, setNewBio] = useState('');
  const [profilePicture, setProfilePicture] = useState(null); // State for profile picture
  const fileInputRef = useRef(null); // Reference for file input

  // Fetch posts, profile, and notifications for the homepage
  useEffect(() => {
    const fetchProfileData = async () => {
      const storedUsername = localStorage.getItem('username');
      if (!storedUsername) return navigate('/login'); // Redirect if no username is stored

      setUsername(storedUsername);

      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        const [profileResponse, postsResponse, notificationsResponse] = await Promise.all([
          axios.get(`http://localhost:5001/api/profile/getProfile/${storedUsername}`, { headers }),
          axios.get(`http://localhost:5001/api/posts/getUserAndFollowersPosts/${storedUsername}`, { headers }),
          axios.get(`http://localhost:5001/api/notifications/${storedUsername}`, { headers }),
        ]);

        setProfile(profileResponse.data);
        setNewBio(profileResponse.data.bio);
        setPostedRoutes(postsResponse.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        setNotifications(notificationsResponse.data);

        // Fetch profile picture from backend
        const picResponse = await axios.get(`http://localhost:5001/api/profile/getPicture/${profileResponse.data._id}`, {
          responseType: 'blob'
        });
        setProfilePicture(URL.createObjectURL(picResponse.data)); // Convert the blob to URL for display
      } catch (error) {
        console.error('Error fetching profile, posts, or notifications:', error);
      }
    };

    fetchProfileData();
  }, [navigate]);

  // Handle file input change (uploading profile picture)
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('profilePicture', file);
      formData.append('userId', profile._id); // Assuming profile._id contains the logged-in user's MongoDB ID

      try {
        // Upload profile picture
        await axios.post('http://localhost:5001/api/profile/uploadPicture', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        // Fetch and update the profile picture after upload
        const picResponse = await axios.get(`http://localhost:5001/api/profile/getPicture/${profile._id}`, {
          responseType: 'blob'
        });
        setProfilePicture(URL.createObjectURL(picResponse.data)); // Convert the blob to URL for display
      } catch (error) {
        console.error('Error uploading profile picture:', error);
      }
    }
  };

  // Trigger file input click for selecting a new profile picture
  const handleEditProfilePictureClick = () => {
    fileInputRef.current.click(); // Simulate a click on the hidden file input
  };

  // Handle deleting a post
  const handleDeletePost = async (postId) => {
    try {
      await axios.delete(`http://localhost:5001/api/posts/${postId}`);
      setPostedRoutes((prevRoutes) => prevRoutes.filter((post) => post._id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  // Handle saving bio
  const handleSaveBio = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      await axios.post(
        'http://localhost:5001/api/profile/updateBio',
        { username, bio: newBio },
        { headers }
      );

      // Make sure the profile is updated with the new bio
      setProfile((prevProfile) => ({ ...prevProfile, bio: newBio }));
      setIsEditing(false);
      console.log('Bio updated successfully');
    } catch (error) {
      console.error('Error updating bio:', error);
    }
  };

  // Handle deleting a notification
  const handleDeleteNotification = async (notificationId) => {
    try {
      const userId = profile._id; // Assuming profile._id contains the logged-in user's MongoDB ID
      await axios.delete(`http://localhost:5001/api/notifications/${userId}/${notificationId}`);
      setNotifications((prevNotifications) => prevNotifications.filter((n) => n._id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  return (
    <div className="homepage-container" id="homepage-container-custom">
      <NavbarCustom
        username={username}
        setPostedRoutes={setPostedRoutes} // Ensures that NavbarCustom can update the feed
        showModal={showModal}
        setShowModal={setShowModal}
      />

      <div className="main-content" id="main-content-custom">
        {/* Profile Column */}
        <div className="profile-column">
          <div className="profile-card">
            <div className="profile-picture-placeholder">
              {profilePicture ? (
                <img
                  src={profilePicture}
                  alt="Profile"
                  className="profile-picture"
                />
              ) : (
                <div className="profile-picture-placeholder-text">
                  No Image Selected
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange} // Handle profile picture file change
              />
            </div>
            <h2 className="profile-username">
              {profile ? profile.username : username}
            </h2>
            {isEditing ? (
              <>
                <textarea
                  value={newBio}
                  onChange={(e) => setNewBio(e.target.value)}
                  maxLength={300}
                  placeholder="Enter your short bio, 300 characters max"
                  className="bio-input"
                />
                <div className="edit-buttons">
                  <button onClick={handleSaveBio} className="save-bio-button">
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="cancel-bio-button"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="bio-display">{profile?.bio || 'No bio available'}</p>
                <div className="edit-buttons">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="edit-bio-button"
                  >
                    Edit Bio
                  </button>
                  <button
                    onClick={handleEditProfilePictureClick}
                    className="edit-bio-button"
                  >
                    Edit Pic
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Feed Column */}
        <div className="feed-column">
          {postedRoutes && postedRoutes.length > 0 ? (
            postedRoutes.map((post) => (
              <UserPost
                key={post._id}
                post={post}
                loggedInUser={username}
                profilePicture={profilePicture}  // Pass profile picture prop here
                onDeletePost={handleDeletePost}
              />
            ))
          ) : (
            <p>No posts to display</p>
          )}
        </div>

        {/* Notifications Column */}
        <div className="notifications-column">
          <h3>Notifications</h3>
          <ul>
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <li key={notification._id} className="notification-item">
                  <div className="notification-content">
                    <span>{notification.message}</span>
                    <span className="notification-time">
                      {getRelativeTime(notification.createdAt)}
                    </span> {/* Display time in gray and italic */}
                    <button
                      className="delete-notification-button"
                      onClick={() => handleDeleteNotification(notification._id)}
                    >
                      ❌
                    </button>
                  </div>
                </li>
              ))
            ) : (
              <li>No new notifications</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
