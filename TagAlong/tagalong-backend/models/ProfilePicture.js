// /models/ProfilePicture.js
import mongoose from 'mongoose';

const profilePictureSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  data: Buffer,  // To store the image data
  contentType: String,  // To store the file type (e.g., 'image/jpeg')
  filename: String,  // To store the original filename
  createdAt: { type: Date, default: Date.now }
});

const ProfilePicture = mongoose.model('ProfilePicture', profilePictureSchema);
export default ProfilePicture;
