const mongoose = require('mongoose');
const connectDB = async () => {
    try {
        // Check if MONGODB_URI is defined, use fallback for development
        const mongoUri = process.env.MONGODB_URI;

        console.log('Attempting to connect to MongoDB...');
        console.log('URI:', mongoUri);

        await mongoose.connect(mongoUri);
        console.log('✅ MongoDB connected successfully');

        // Test the connection
        const db = mongoose.connection;
        console.log('Database name:', db.name);
        console.log('Database host:', db.host);
        console.log('Database port:', db.port);

    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        console.error('Please check if MongoDB is running and the connection string is correct');

        // For development, don't exit the process, just log the error
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        } else {
            console.log('⚠️  Continuing in development mode without database...');
        }
    }
};

module.exports = connectDB;
