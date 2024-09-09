import mongoose from 'mongoose';

const { Schema } = mongoose;

// Comment Schema
const commentSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  username: { type: String, required: true },
  text: { type: String, required: true },
}, { timestamps: true }); // This automatically generates an _id and timestamps

// Post Schema
const postSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  origin: {
    latLng: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    address: { type: String, required: true },
  },
  destination: {
    latLng: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    address: { type: String, required: true },
  },
  travelMode: { 
    type: String, 
    enum: ['WALKING', 'BICYCLING', 'DRIVING'], 
    required: true 
  },
  description: { type: String },
  roadDistance: { type: String },
  walkingTime: { type: String },
  joggingTime: { type: String },
  bikingTime: { type: String },
  drivingTime: { type: String },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [commentSchema], // Embedded comment schema
  createdAt: { type: Date, default: Date.now },
  visibility: { type: String, default: 'private' },
});

// User Schema
const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  bio: {
    type: String,
    default: '', // Default value as an empty string
  },
  posts: [{ type: Schema.Types.ObjectId, ref: 'Post' }], // References to posts created by the user
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Field for followers
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Field for following
}, { timestamps: true }); // Adds createdAt and updatedAt timestamps

// Create models
const User = mongoose.model('User', userSchema);
const Post = mongoose.model('Post', postSchema);

export { User, Post };
