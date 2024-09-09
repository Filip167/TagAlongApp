import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './VisitHomePage.css';
import UserPost from '../Post';
import NavbarCustom from '../NavbarCustom';

const VisitHomePage = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const loggedInUser = localStorage.getItem('username');
  const [postedRoutes, setPostedRoutes] = useState([]);
  const [profile, setProfile] = useState(null);
  const [profilePicture, setProfilePicture] = useState(null); // Add state for profile picture
  const [isFollowing, setIsFollowing] = useState(false);
  const [userExists, setUserExists] = useState(true);

  useEffect(() => {
    const checkUserExists = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/api/users/checkUser/${username}`);
        if (response.status === 200) {
          fetchProfileAndPosts();
        }
      } catch (error) {
        if (error.response && error.response.status === 404) {
          setUserExists(false);
        } else {
          console.error('Error checking if user exists:', error);
        }
      }
    };

    const fetchProfileAndPosts = async () => {
      try {
        const postsResponse = await axios.get(`http://localhost:5001/api/posts/getUserPosts/${username}`);
        setPostedRoutes(postsResponse.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));

        const profileResponse = await axios.get(`http://localhost:5001/api/profile/getProfile/${username}`);
        setProfile(profileResponse.data);

        // Fetch profile picture
        const picResponse = await axios.get(`http://localhost:5001/api/profile/getPicture/${profileResponse.data._id}`, {
          responseType: 'blob'
        });
        setProfilePicture(URL.createObjectURL(picResponse.data));

        await fetchFollowStatus();
      } catch (error) {
        console.error('Error fetching profile data or posts:', error);
      }
    };

    const fetchFollowStatus = async () => {
      try {
        const followStatus = await axios.post('http://localhost:5001/api/follow/checkFollowStatus', {
          followerUsername: loggedInUser,
          followedUsername: username,
        });

        setIsFollowing(followStatus.data.isFollowing);
      } catch (error) {
        console.error('Error fetching follow status:', error);
      }
    };

    checkUserExists();
  }, [username, loggedInUser]);

  const handleFollow = async () => {
    try {
      await axios.patch('http://localhost:5001/api/follow/follow', {
        followerUsername: loggedInUser,
        followedUsername: username,
      });
      setIsFollowing(true);
      alert(`You are now following ${username}`);
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const handleUnfollow = async () => {
    try {
      await axios.patch('http://localhost:5001/api/follow/unfollow', {
        followerUsername: loggedInUser,
        followedUsername: username,
      });
      setIsFollowing(false);
      alert(`You have unfollowed ${username}`);
    } catch (error) {
      console.error('Error unfollowing user:', error);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await axios.delete(`http://localhost:5001/api/posts/${postId}`);
      setPostedRoutes(postedRoutes.filter((post) => post._id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  if (!userExists) {
    return (
      <div className="visit-homepage-container">
        <NavbarCustom />
        <div className="visit-main-content">
          <h2>User "{username}" not found.</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="visit-homepage-container">
      <NavbarCustom setPostedRoutes={setPostedRoutes} />
      <div className="visit-main-content">
        <div className="visit-profile-column">
          <div className="visit-profile-card">
            <div className="visit-profile-picture-placeholder">
              <img
                src={profilePicture || '/path/to/default-profile-picture.jpg'}
                alt={`${profile?.username || 'Unknown User'}'s profile`}
                className="visit-profile-picture"
              />
            </div>
            <h2 className="visit-profile-username">{profile ? profile.username : username}</h2>
            <p>{profile?.bio}</p>
            {!isFollowing && profile && profile.username !== loggedInUser && (
              <button className="visit-follow-button" onClick={handleFollow}>Follow</button>
            )}
            {isFollowing && (
              <button className="visit-unfollow-button" onClick={handleUnfollow}>Unfollow</button>
            )}
          </div>
        </div>

        <div className="visit-feed-column">
          {postedRoutes && postedRoutes.length > 0 ? (
            postedRoutes.map((post) => (
              <UserPost
                key={post._id}
                post={post}
                loggedInUser={loggedInUser}
                onDeletePost={handleDeletePost}
              />
            ))
          ) : (
            <p>No posts to display</p>
          )}
        </div>

        <div className="visit-blank-column"></div>
      </div>
    </div>
  );
};

export default VisitHomePage;