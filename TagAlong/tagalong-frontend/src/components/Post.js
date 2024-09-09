import React, { useState, useEffect } from 'react';
import { ThumbUp, Delete } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import './Post.css';
import axios from 'axios';

const Post = ({ post, profilePicture, loggedInUser, onDeletePost }) => {
  const [comments, setComments] = useState(post.comments || []);
  const [likes, setLikes] = useState(post.likes || 0);
  const [likedBy, setLikedBy] = useState(post.likedBy || []);
  const [isLiked, setIsLiked] = useState(false); // Track if the user has liked the post
  const [newComment, setNewComment] = useState('');
  const [userProfilePicture, setUserProfilePicture] = useState(post.user?.profilePicture || '/path/to/default-profile-picture.jpg');


  // Fetch like status when the component loads
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch like status
        const likeStatusResponse = await axios.get(`http://localhost:5001/api/posts/${post._id}/like-status/${loggedInUser}`);
        setIsLiked(likeStatusResponse.data.liked); // Set 'isLiked' based on the fetched status
  
        // Fetch profile picture if it doesn't exist
        if (!post.user?.profilePicture) {
          const profilePicResponse = await axios.get(`http://localhost:5001/api/profile/getPicture/${post.user?._id}`, {
            responseType: 'blob',
          });
          const imageURL = URL.createObjectURL(profilePicResponse.data);
          setUserProfilePicture(imageURL); // Set the fetched profile picture URL
        } else {
          setUserProfilePicture(post.user.profilePicture); // If the profile picture is already present
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
  
    fetchData();
  }, [post._id, loggedInUser, post.user?._id, post.user?.profilePicture]);
  
  

  const handleAddComment = async () => {
    if (newComment.trim() !== '') {
      try {
        const response = await axios.post(
          `http://localhost:5001/api/posts/${post._id}/comments`,
          { text: newComment, username: loggedInUser }
        );
        
        // Add the full comment (with the _id) to the state
        setComments([...comments, response.data]); 
        setNewComment(''); // Clear the input field
      } catch (error) {
        console.error('Error adding comment:', error);
      }
    }
  };
  

  const handleLike = async () => {
    try {
      if (isLiked) {
        // Unlike the post
        await axios.post(`http://localhost:5001/api/posts/${post._id}/unlike`, { username: loggedInUser });
        setLikes((prevLikes) => prevLikes - 1);  // Update like count immediately
        setLikedBy((prevLikedBy) => prevLikedBy.filter(user => user !== loggedInUser));  // Remove user from likedBy
        setIsLiked(false);  // Set post to "unliked" state
  
        // Optional: Remove the like notification if you want to handle that
        setNotifications((prevNotifications) =>
          prevNotifications.filter((notification) => notification.message !== `${loggedInUser} liked your post`)
        );
        
      } else {
        // Like the post
        await axios.post(`http://localhost:5001/api/posts/${post._id}/like`, { username: loggedInUser });
        setLikes((prevLikes) => prevLikes + 1);  // Update like count immediately
        setLikedBy((prevLikedBy) => [...prevLikedBy, loggedInUser]);  // Add user to likedBy
        setIsLiked(true);  // Set post to "liked" state
  
        // Update notifications immediately with the new like notification
        setNotifications((prevNotifications) => [
          ...prevNotifications,
          { message: `${loggedInUser} liked your post`, type: 'like', _id: new Date().getTime() }  // Add the new like notification
        ]);
      }
    } catch (error) {
      console.error('Error liking/unliking post:', error);
    }
  };
  

  const handleDeleteComment = async (commentId) => {
    try {
      await axios.delete(`http://localhost:5001/api/posts/${post._id}/comments/${commentId}`, {
        data: { username: loggedInUser }
      });
  
      // Remove the comment from the state after deletion
      setComments(comments.filter(comment => comment._id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  return (
    <div className="post-container">
      <div className="post-header">
        <div className="post-user-info">
          <img
            src={userProfilePicture}
            alt={`${post.user?.username || 'Unknown User'}'s profile`}
            className="post-user-icon"
          />
          <h3>
            <Link to={`/visit/${post.user?.username || 'UnknownUser'}`} className="post-username-link">
              {post.user?.username || 'Unknown User'}
            </Link>
          </h3>
        </div>
        {post.user?.username === loggedInUser && (
          <Delete className="delete-icon" onClick={() => onDeletePost(post._id)} />
        )}
      </div>

      {post.description && (
        <div className="post-description">
          <p>{post.description}</p>
        </div>
      )}

      <div className="feed-post-map">
        {post.origin?.latLng?.lat && post.destination?.latLng?.lat ? (
          <iframe
            title="Map"
            src={`https://www.google.com/maps/embed/v1/directions?key=${process.env.REACT_APP_GOOGLE_API_KEY}&origin=${post.origin.latLng.lat},${post.origin.latLng.lng}&destination=${post.destination.latLng.lat},${post.destination.latLng.lng}&mode=${post.travelMode.toLowerCase()}`}
            width="100%"
            height="300"
            frameBorder="0"
            style={{ border: 0 }}
            allowFullScreen
          ></iframe>
        ) : (
          <p>Location data is missing or incomplete.</p>
        )}
      </div>

      <div className="distance-time-info">
        <span>Distance: {post.roadDistance}</span>
        <span>
          Time: {post.walkingTime || post.drivingTime || post.bikingTime || post.joggingTime} ({post.travelMode.toLowerCase()})
        </span>
      </div>

      <div className="like-section">
        <button onClick={handleLike}>
          <ThumbUp color={isLiked ? 'primary' : 'inherit'} />
          {likes} {likes === 1 ? 'Like' : 'Likes'}
        </button>
      </div>

      <div className="comments-container">
        <ul className="list--unstyled">
          {comments.map((comment) => (
            <li key={comment._id} className="list-item">
              <span>{comment.username}: {comment.text}</span>
              {(comment.username === loggedInUser) && (
                <Delete className="comment-delete" onClick={() => handleDeleteComment(comment._id)} />
              )}
            </li>
          ))}
        </ul>
        <div className="add-comment-container">
          <input
            type="text"
            className="comment-input"
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' ? handleAddComment() : null}
          />
          <button onClick={handleAddComment} className="comment-add-button">Add</button>
        </div>
      </div>
    </div>
  );
};

export default Post;
