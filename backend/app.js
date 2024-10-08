require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors'); // Import CORS middleware

app.use(cors()); // Enable CORS for all origins
app.use(bodyParser.json());

// MongoDB connection
const dbUrl = process.env.MONGO_URI || 'mongodb://localhost:27017/secure-url-approval';

let db;

if (process.env.USE_FIREBASE === 'true') {
    db = require('./firebase-config'); // Use Firestore when USE_FIREBASE is true
} else {
    mongoose.connect(dbUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
}

// URL Schema
const urlSchema = new mongoose.Schema({
    urlId: String,
    documentId: String,
    registeredDeviceId: String, // Store the device ID directly as plaintext
    status: { type: String, enum: ['pending', 'approved'], default: 'pending' }
});

const URL = mongoose.model('URL', urlSchema);

// Middleware to verify device ID and load the URL if access is granted
app.post('/access-url', async (req, res) => {
    const { urlId, macAddress } = req.body;

    console.log(`Access attempt for URL ID: ${urlId}`);
    console.log(`Device Identifier attempting access: ${macAddress}`);

    try {
        let doc;
        if (process.env.USE_FIREBASE === 'true') {
            // Firestore logic
            const snapshot = await db.collection('urls').where('urlId', '==', urlId).get();
            if (!snapshot.empty) {
                doc = snapshot.docs[0].data();
            }
        } else {
            // MongoDB logic
            doc = await URL.findOne({ urlId });
        }

        if (!doc) {
            console.log('URL not found'); // Log if the URL does not exist
            return res.status(404).send('URL not found');
        }

        if (!doc.registeredDeviceId) {
            // First-time access, register device ID directly
            console.log('First-time access. Registering device identifier...');
            doc.registeredDeviceId = macAddress; // Store the device identifier directly
            await doc.save();
            console.log(`Device ID registered: ${macAddress}`);
            return res.status(200).json({ message: 'Access granted for first-time login.', redirectUrl: `http://${doc.urlId}` });
        } else {
            // If the device ID is already registered, verify it
            console.log(`Stored Device ID: ${doc.registeredDeviceId}`);

            if (macAddress === doc.registeredDeviceId) {
                // Device identifiers match
                console.log('Device identifiers match. Access granted.');
                return res.status(200).json({ message: 'Access granted.', redirectUrl: `http://${doc.urlId}` });
            } else {
                // Device identifiers do not match
                console.log('Device identifiers do not match. Access not granted.');
                return res.status(403).send('Access not granted');
            }
        }
    } catch (error) {
        console.error('Error accessing URL:', error);
        return res.status(500).send('Internal server error');
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

