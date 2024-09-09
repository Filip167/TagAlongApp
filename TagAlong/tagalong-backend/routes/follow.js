// /routes/follow.js
import express from 'express';
import { User } from '../models/UserPost.js';
import Notification from '../models/Notification.js'; // Import the notification model

const router = express.Router();

// Follow a user
router.patch('/follow', async (req, res) => {
  const { followerUsername, followedUsername } = req.body;

  if (!followerUsername || !followedUsername) {
    return res.status(400).json({ message: 'Follower and followed usernames are required' });
  }

  try {
    const follower = await User.findOne({ username: followerUsername });
    const followed = await User.findOne({ username: followedUsername });

    if (!follower || !followed) {
      return res.status(404).json({ message: 'Follower or followed user not found' });
    }

    // Update the following/followers relationship directly in the User model
    await User.findByIdAndUpdate(follower._id, { $addToSet: { following: followed._id } });
    await User.findByIdAndUpdate(followed._id, { $addToSet: { followers: follower._id } });

    // Create a follow notification for the followed user
    const notification = new Notification({
      user: followed._id,
      sender: follower._id,
      message: `${follower.username} started following you!`,
      type: 'follow',
    });

    await notification.save();

    res.status(200).json({ message: `${followerUsername} started following ${followedUsername}` });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({ message: 'Error following user', error });
  }
});

// Unfollow a user
router.patch('/unfollow', async (req, res) => {
  const { followerUsername, followedUsername } = req.body;

  if (!followerUsername || !followedUsername) {
    return res.status(400).json({ message: 'Follower and followed usernames are required' });
  }

  try {
    const follower = await User.findOne({ username: followerUsername });
    const followed = await User.findOne({ username: followedUsername });

    if (!follower || !followed) {
      return res.status(404).json({ message: 'Follower or followed user not found' });
    }

    // Remove the following/followers relationship directly in the User model
    await User.findByIdAndUpdate(follower._id, { $pull: { following: followed._id } });
    await User.findByIdAndUpdate(followed._id, { $pull: { followers: follower._id } });

    res.status(200).json({ message: `${followerUsername} unfollowed ${followedUsername}` });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).json({ message: 'Error unfollowing user', error });
  }
});

// Check follow status
router.post('/checkFollowStatus', async (req, res) => {
  const { followerUsername, followedUsername } = req.body;

  try {
    const follower = await User.findOne({ username: followerUsername });
    const followed = await User.findOne({ username: followedUsername });

    if (!follower || !followed) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the followed user's ID is in the follower's following array
    const isFollowing = follower.following.includes(followed._id);

    res.status(200).json({ isFollowing }); // Send true if following, false otherwise
  } catch (error) {
    console.error('Error checking follow status:', error);
    res.status(500).json({ message: 'Error checking follow status' });
  }
});

export default router;
