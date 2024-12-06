const express = require('express');
const multer = require('multer');
const path = require('path');
const uuid = require('uuid');
const { predictImage } = require('./routes/predict');
const { initializeFirebase } = require('./utils/firebase');

const app = express();
const port = process.env.PORT || 9000;

// Initialize Firebase
initializeFirebase();

// Configure multer for image upload
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 1000000 },  // 1MB
}).single('image');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.post('/predict', upload, predictImage);

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
