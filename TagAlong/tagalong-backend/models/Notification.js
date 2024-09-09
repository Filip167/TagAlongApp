import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // The user who receives the notification
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // The user who triggers the notification
  message: { type: String, required: true },
  type: { type: String, required: true }, // Example: "follow", "comment", "like"
  createdAt: { type: Date, default: Date.now },
  read: { type: Boolean, default: false }, // Optional: To track if the user has seen the notification
});

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
