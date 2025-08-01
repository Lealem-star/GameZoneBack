require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const adminRoutes = require('./routes/AdminRoutes');
const userRoutes = require('./routes/UserRoutes');
const gameRoutes = require('./routes/GameRoutes');
const participantRoutes = require('./routes/ParticipantRoutes');
const prizeRoutes = require('./routes/PrizeRoutes');
const authRoutes = require('./routes/auth');
const { createAdminUser } = require('./scripts/createAdmin');
const { upload, handleUploadError } = require('./middleware/uploadMiddleware'); // Import multer middleware

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' })); // Increased limit for JSON
app.use(express.urlencoded({ limit: '20mb', extended: true })); // Increased limit for URL-encoded data

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('📁 Created uploads directory');
}

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB and create admin user
connectDB().then(() => {
    try {
        createAdminUser();
    } catch (error) {
        console.error('Error creating admin user:', error);
    }
}).catch(error => {
    console.error('Failed to connect to database:', error);
});

// Use routes
app.get('/', (req, res) => {
    res.send('Hello World');
});
app.use('/api/auth', authRoutes);
app.use('/api/', adminRoutes);
app.use('/api', userRoutes);
app.use('/api', gameRoutes);
app.use('/api', participantRoutes);
app.use('/api', prizeRoutes);

// Example route for file upload
app.post('/api/upload', upload.single('image'), (req, res) => {
    res.status(200).json({ message: 'File uploaded successfully', file: req.file });
});

// Handle multer upload errors
app.use(handleUploadError);

// Start the server
app.listen(PORT,'0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
