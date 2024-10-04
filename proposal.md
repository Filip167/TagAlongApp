Capstone Project Proposal: TagAlong
Description: TagAlong is a web application designed to help users create, share, and follow custom running, biking, or walking routes. The app will include social features like adding friends, viewing shared routes, and posting comments on activities. The goal is to build an engaging and interactive platform where users can create routes and connect with friends based on shared fitness goals.

Stack:

Frontend: React.js
Backend: Node.js with Express
Database: MongoDB
APIs: Google Maps API (for route creation), Places API, and Directions API
Authentication: JWT (JSON Web Tokens) and bcrypt for password hashing
Deployment: AWS (Elastic Beanstalk, EC2, S3 for image uploads)
Focus: This project will be a full-stack application with an equal focus on both the frontend UI/UX and backend functionalities. The backend will handle data storage, user authentication, and interactions with the Google Maps API, while the frontend will provide a responsive and user-friendly experience for creating and sharing routes.

Type: This will be a web application optimized for both desktop and mobile browsers.

Goal: The primary goal of TagAlong is to allow users to:

Create custom running, biking, and walking routes using Google Maps.
Share these routes with friends and add descriptions (date, time, and event details).
Connect with friends, follow their activities, and comment or like posts.
Save routes for later use or delete them if needed.
Users: The target demographic for TagAlong consists of:

Fitness enthusiasts who enjoy running, walking, or biking.
Individuals looking for social interaction based on fitness activities.
Users aged 18-45, tech-savvy and familiar with social platforms.
Data:

User Data: User profiles, including name, bio, profile picture, and friends.
Route Data: Custom routes created using Google Maps, including distance, duration, and descriptions.
Posts: Users’ shared routes with the ability to like, comment, and view others' activities.
Data will be collected through user input (profile details, route creation) and the Google Maps API. The database will store users, routes, posts, and friendships in MongoDB.
Database Schema:

Users: Username, email, password, bio, profile picture, friends list, posts.
Posts: Route details, comments, likes, timestamps, linked user.
Routes: Starting point, destination, route coordinates, distance, duration.
Potential Issues:

Handling real-time data updates efficiently between users (e.g., new posts, comments).
API limitations with Google Maps regarding the number of route requests.
Ensuring smooth performance when multiple users are interacting with the map and route creation feature.
Securing user data such as passwords and routes.
Sensitive Information: Sensitive information like user passwords will be hashed using bcrypt, and JWT will be implemented to secure the authentication process. Any personally identifiable information (PII) will be encrypted.

Functionality:

Route Creation: Users can create custom routes using Google Maps APIs.
Friends List: Users can add or remove friends, see their posts, and interact through comments and likes.
Profile Management: Users can upload profile pictures, update bios, and manage routes.
Real-Time Notifications: Friend requests, new posts, and comments will trigger notifications.
User Flow:

Sign-up/Login: Users register or log in to access their personalized homepage.
Create Route: Users can create a route using the interactive map.
Share Route: Users can post the route with a description, which will appear on the feed.
Friendship Management: Users can search for friends, send requests, and view their friends’ shared routes.
Stretch Goals:

Mobile App: Build a native mobile version of the app.
Gamification: Add achievement badges based on the number of routes completed or distance covered.
Event Creation: Allow users to organize group runs, walks, or biking events.
GitHub Repository: https://github.com/Filip167/TagAlongApp