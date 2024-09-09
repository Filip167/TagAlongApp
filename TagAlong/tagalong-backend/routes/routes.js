import express from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { User, Post } from '../models/UserPost.js';
import Notification from '../models/Notification.js';
import ProfilePicture from '../models/ProfilePicture.js';
import followRoutes from './follow.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ====================
// Profile Picture Routes
// ====================

// Upload profile picture
router.post('/profile/uploadPicture', upload.single('profilePicture'), async (req, res) => {
  try {
    const { userId } = req.body;
    const file = req.file;

    if (!file || !userId) {
      return res.status(400).json({ message: 'Image file and user ID are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await ProfilePicture.findOneAndDelete({ user: userId });

    const newProfilePicture = new ProfilePicture({
      user: userId,
      data: file.buffer,
      contentType: file.mimetype,
      filename: file.originalname,
    });

    await newProfilePicture.save();
    res.status(200).json({ message: 'Profile picture uploaded successfully' });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ message: 'Error uploading profile picture', error });
  }
});

// Retrieve profile picture
router.get('/profile/getPicture/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const profilePicture = await ProfilePicture.findOne({ user: userId });

    if (!profilePicture) {
      return res.status(404).json({ message: 'No profile picture found for this user' });
    }

    res.set('Content-Type', profilePicture.contentType);
    res.send(profilePicture.data);
  } catch (error) {
    console.error('Error retrieving profile picture:', error);
    res.status(500).json({ message: 'Error retrieving profile picture', error });
  }
});

// ====================
// User Authentication
// ====================

router.post('/users/signup', async (req, res, next) => {
  const { username, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    next(error);
  }
});

router.post('/users/login', async (req, res, next) => {
  const { emailOrUsername, password } = req.body;
  try {
    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
    });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    res.json({ message: 'Login successful', username: user.username });
  } catch (error) {
    next(error);
  }
});

// ====================
// Profile & Users
// ====================

router.get('/profile/getProfile/:username', async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
});

router.get('/users/checkUser/:username', async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User found', user });
  } catch (error) {
    next(error);
  }
});

router.post('/profile/updateBio', async (req, res, next) => {
  const { username, bio } = req.body;
  try {
    const updatedUser = await User.findOneAndUpdate(
      { username: username },
      { bio },
      { new: true }
    );
    res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
});

// ====================
// Posts
// ====================

router.post('/posts/createPost', async (req, res, next) => {
  const {
    origin,
    destination,
    travelMode,
    roadDistance,
    walkingTime,
    joggingTime,
    bikingTime,
    drivingTime,
    description,
    username,
  } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const newPost = new Post({
      user: user._id,
      origin,
      destination,
      travelMode: travelMode.toUpperCase(),
      description,
      roadDistance,
      walkingTime,
      joggingTime,
      bikingTime,
      drivingTime,
      likedBy: [],
      comments: [],
      likes: 0,
    });

    await newPost.save();
    await newPost.populate('user', 'username profilePicture').execPopulate();

    res.status(201).json(newPost);
  } catch (error) {
    next(error);
  }
});

// ====================
// Fetch User & Followers Posts with Profile Picture
// ====================

router.get('/posts/getUserAndFollowersPosts/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).populate('following');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const followedUserIds = user.following.map(followingUser => followingUser._id.toString());
    followedUserIds.push(user._id.toString());

    const posts = await Post.find({
      user: { $in: followedUserIds }
    }).populate('user', 'username');

    for (let post of posts) {
      const profilePicture = await ProfilePicture.findOne({ user: post.user._id });
      if (profilePicture) {
        post.user.profilePicture = `data:${profilePicture.contentType};base64,${profilePicture.data.toString('base64')}`;
      } else {
        post.user.profilePicture = '/path/to/default-profile-picture.jpg';
      }
    }

    const sortedPosts = posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.status(200).json(sortedPosts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching posts', error });
  }
});

// ====================
// Fetch User Posts with Profile Picture
// ====================

router.get('/posts/getUserPosts/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userPosts = await Post.find({ user: user._id }).sort({ createdAt: -1 }).populate('user', 'username');

    for (let post of userPosts) {
      const profilePicture = await ProfilePicture.findOne({ user: post.user._id });
      if (profilePicture) {
        post.user.profilePicture = `data:${profilePicture.contentType};base64,${profilePicture.data.toString('base64')}`;
      } else {
        post.user.profilePicture = '/path/to/default-profile-picture.jpg';
      }
    }

    res.status(200).json(userPosts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user posts', error });
  }
});

// ====================
// Delete Post
// ====================

router.delete('/posts/:postId', async (req, res) => {
  try {
    const postId = req.params.postId;
    const post = await Post.findByIdAndDelete(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting post', error });
  }
});

// ====================
// Comments
// ====================

router.post('/posts/:postId/comments', async (req, res) => {
  try {
    const { text, username } = req.body;
    const post = await Post.findById(req.params.postId).populate('user');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const user = await User.findOne({ username });

    const newComment = {
      userId: user._id,
      username: user.username,
      text,
    };

    post.comments.push(newComment);
    await post.save();

    // Get the newly added comment (with the _id generated by Mongoose)
    const addedComment = post.comments[post.comments.length - 1]; 

    const notification = new Notification({
      user: post.user._id,
      sender: user._id,
      message: `${username} commented on your post`,
      type: 'comment',
    });
    await notification.save();

    res.status(201).json(addedComment); // Return the full comment with _id
  } catch (error) {
    res.status(500).json({ message: 'Error commenting on post', error });
  }
});


router.get('/posts/:postId/comments', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId).populate('comments.userId', 'username');
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.status(200).json(post.comments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching comments', error });
  }
});

router.delete('/posts/:postId/comments/:commentId', async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    console.log('Comments before deletion:', post.comments); // Debugging line

    // Find the comment in the post's comments array
    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Optionally, you can add a check to ensure that only the comment author or post owner can delete the comment
    if (comment.username !== req.body.username) {
      return res.status(403).json({ message: 'You do not have permission to delete this comment' });
    }

    // Remove the comment from the post's comments array
    comment.remove();
    await post.save(); // Save the post after removing the comment

    console.log('Comments after deletion:', post.comments); // Debugging line

    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting comment', error });
  }
});



// ====================
// Notifications
// ====================

router.get('/notifications/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const notifications = await Notification.find({ user: user._id }).sort({ createdAt: -1 });
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications', error });
  }
});


router.delete('/notifications/:userId/:notificationId', async (req, res) => {
  try {
    const { notificationId } = req.params;
    await Notification.findByIdAndDelete(notificationId);
    res.status(200).json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting notification', error });
  }
});

// ====================
// Like Logic
// ====================

router.post('/posts/:postId/like', async (req, res) => {
  try {
    console.log('Request body:', req.body); // Log the body received
    const { username } = req.body;

    const post = await Post.findById(req.params.postId);
    const user = await User.findOne({ username });

    if (!post || !user) {
      console.log('Post or user not found.');
      return res.status(404).json({ message: 'Post or user not found' });
    }

    if (post.likedBy.includes(user._id)) {
      console.log('Post already liked by user.');
      return res.status(400).json({ message: 'Post already liked by user' });
    }

    post.likes += 1;
    post.likedBy.push(user._id);
    await post.save();
    console.log(`User ${user._id} liked post ${post._id}. Updated likes: ${post.likes}`);

    const notification = new Notification({
      user: post.user._id, // Post owner's ID
      sender: user._id,    // User who liked the post
      message: `${user.username} liked your post`,
      type: 'like',
    });
    await notification.save();


    res.status(200).json({ message: 'Post liked', likes: post.likes });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ message: 'Error liking post', error });
  }
});



router.post('/posts/:postId/unlike', async (req, res) => {
  try {
    // Log the incoming request body
    console.log('Request body:', req.body);

    const { username } = req.body;
    
    // Find the post by its ID
    const post = await Post.findById(req.params.postId);
    if (!post) {
      console.log('Post not found with ID:', req.params.postId);
      return res.status(404).json({ message: 'Post not found' });
    }

    // Find the user by username
    const user = await User.findOne({ username });
    if (!user) {
      console.log('User not found with username:', username);
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the user hasn't liked the post
    if (!post.likedBy.includes(user._id)) {
      console.log(`User ${user._id} has not liked post ${post._id}`);
      return res.status(400).json({ message: 'Post not liked by user' });
    }

    // Decrease the like count and remove the user from the likedBy array
    post.likes -= 1;
    post.likedBy.pull(user._id);
    await post.save();

    // Log successful unlike operation
    console.log(`User ${user._id} unliked post ${post._id}. Updated likes: ${post.likes}`);

    // Send success response
    res.status(200).json({ message: 'Post unliked', likes: post.likes });
  } catch (error) {
    // Log the error and send the 500 error response
    console.error('Error unliking post:', error);
    res.status(500).json({ message: 'Error unliking post', error });
  }
});

router.get('/posts/:postId/like-status/:username', async (req, res) => {
  try {
    const { postId, username } = req.params;

    const post = await Post.findById(postId);
    const user = await User.findOne({ username });

    if (!post || !user) {
      return res.status(404).json({ message: 'Post or user not found' });
    }

    const hasLiked = post.likedBy.includes(user._id);
    res.status(200).json({ liked: hasLiked });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching like status' });
  }
});


router.use('/follow', followRoutes);

export default router;
