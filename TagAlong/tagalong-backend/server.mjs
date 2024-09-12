import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch'; // Import node-fetch for making external API calls
import routes from './routes/routes.js';
import path from 'path'; // For handling file paths
import { fileURLToPath } from 'url'; // To resolve __dirname in ES modules

dotenv.config(); // Load environment variables from .env file

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Middleware to log incoming requests
app.use((req, res, next) => {
  console.log('Incoming request:', req.method, req.url);
  next();
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,         // Use the new URL string parser
  useUnifiedTopology: true,      // Use the new Server Discover and Monitoring engine
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);  // Exit the app if MongoDB connection fails
  });

// Use routes from the routes folder
app.use('/api', routes);

// Directions API endpoint to fetch Google Maps Directions
app.post('/api/directions', async (req, res) => {
  const { origin, destination, mode } = req.body;

  try {
    const response = await fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=${mode}&key=${process.env.GOOGLE_API_KEY}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch directions: ${response.statusText}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching directions:', error);
    res.status(500).send('Error fetching directions');
  }
});

// Serve the React frontend from the build folder
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../tagalong-frontend/build')));

// For any other route not handled by your API, serve the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../tagalong-frontend/build/index.html'));
});

// Set the server to listen on the defined port
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
