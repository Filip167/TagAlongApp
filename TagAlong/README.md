# TagAlong - Social Route Sharing Platform

## URL
[Your Deployed URL Here]

## Description
TagAlong is a social platform that allows users to create and share custom routes using Google Maps. Users can create posts with route descriptions, view friends' posts, and interact by liking and commenting on them. The platform encourages users to connect, share, and discover routes within their community.

## Features
- **Route Creation:** Users can create routes by entering starting and destination points, which are visualized on a map.
- **Profile Management:** Users can upload profile pictures and update their bio.
- **Social Interactions:** Like and comment on friends' posts to engage with their activities.
- **Friendship System:** Add friends and view their posts on your feed.
- **Notifications:** Real-time notifications for likes and comments on posts.
  
These features were chosen to enhance user engagement and provide a community-like experience for discovering and sharing routes.

## Tests
There are no automated tests yet, but manual testing includes:
- Creating and deleting posts.
- Liking/unliking posts.
- Commenting and deleting comments.
- Profile picture uploads and route creation.

## User Flow
1. Sign up or log in to the platform.
2. Create a post by entering a description and selecting route points on the map.
3. View posts from friends and engage by liking or commenting.
4. Manage your profile by uploading a picture and editing your bio.
5. Add friends to see their posts on your feed.

## API Information
- **API Endpoints:**
  - `POST /users/signup`: Register a new user.
  - `POST /users/login`: Log in an existing user.
  - `POST /posts/createPost`: Create a new post with route details.
  - `GET /posts/getUserAndFollowersPosts/:username`: Get posts from the user and their friends.
  
  This API was created using Express and MongoDB to provide CRUD functionality for users, posts, comments, and likes.

## Technology Stack
- **Frontend:** React, Google Maps API for route visualization.
- **Backend:** Node.js, Express, MongoDB for data storage.
- **Authentication:** JWT (JSON Web Tokens) for secure authentication.
- **Hosting:** [Enter your hosting provider, e.g., Heroku, Netlify, etc.]

## How to Run the Project Locally
1. Clone the repository:
   ```bash
   git clone https://github.com/Filip167/TagAlongApp

