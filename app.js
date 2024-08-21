const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const mysql = require('mysql2/promise');

const app = express();

app.use(morgan('dev'));
app.use(express.json());
app.use(bodyParser.json());
app.use(cors());

app.use(bodyParser.urlencoded({ extended: true }));

// MySQL connection
// const pool = mysql.createPool({
//     host: process.env.MYSQL_HOST || 'localhost',
//     user: process.env.MYSQL_USER || 'root',
//     // password: 'your_mysql_password',
//     database: process.env.MYSQL_DATABASE || 'files',
//     waitForConnections: true,
//     connectionLimit: 10,
//     queueLimit: 0
// });


const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'srv1391.hstgr.io',
    user: process.env.MYSQL_USER || 'u858543158_techguideDB',
    password: process.env.MYSQL_PASSWORD || 'WGH^ACq1@5vD',
    database: process.env.MYSQL_DATABASE || 'u858543158_files',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});



// Middleware to log requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});


// Test route to check database connectivity
app.get('/test-db', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT 1');
        res.json({ message: 'Database connection successful', data: rows });
    } catch (err) {
        console.error('Error connecting to the database:', err);
        res.status(500).json({ message: 'Database connection failed', error: err.message });
    }
});


// Route to get data from MySQL
app.get('/data', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM files ORDER BY _id DESC');
        return res.json(rows);
    } catch (err) {
        console.error('Error fetching data:', err);
        res.status(500).send('Server error');
    }
});

// Route to upload a file and save details to MySQL
app.post('/submit', async (req, res) => {
    try {
        const { summarizedContent, campaignId, campaignName, _id, whitepaperHeading, imagedomain, wpimg, Categories, jobtitle, pdfUrl, privacylink,faviconurl,subjobtitle, check} = req.body;

        // Log the file details
        console.log('File details:', {
            summarizedContent, campaignId, campaignName, _id, whitepaperHeading, imagedomain, wpimg, Categories, jobtitle, pdfUrl, privacylink,faviconurl,subjobtitle,check
        });

        const [result] = await pool.query(
            'INSERT INTO files (summarizedContent, campaignId, campaignName, _id, whitepaperHeading, imagedomain, Categories, jobtitle, wpimg, pdfUrl, privacylink,faviconurl,subjobtitle,check) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?)',
            [summarizedContent, campaignId, campaignName, _id, whitepaperHeading, imagedomain, Categories, jobtitle, wpimg, pdfUrl, privacylink,faviconurl,subjobtitle,check]
        );

        res.json({ message: 'File uploaded successfully', file: { _id: result.insertId, ...req.body } });
    } catch (err) {
        console.error('Error uploading file:', err);
        res.status(500).send('Server error');
    }
});


// Endpoint to get a file by ID
app.get('/data/:_id', async (req, res) => {
    try {
        const fileId = req.params._id;
        console.log(`Fetching file with ID: ${fileId}`);

        const [rows] = await pool.query('SELECT * FROM files WHERE _id = ?', [fileId]);

        if (rows.length === 0) {
            return res.status(404).send('File not found');
        }

        res.json(rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});



// Delete data by ID
app.delete('/data/:_id', async (req, res) => {
    try {
        const fileId = req.params.id;

        // Delete the data from MySQL
        const [result] = await pool.query('DELETE FROM files WHERE _id = ?', [fileId]);

        if (result.affectedRows === 0) {
            return res.status(404).send('File not found');
        }

        res.send('File deleted successfully');
    } catch (err) {
        console.error('Error deleting data:', err);
        res.status(500).send('Server error');
    }
});



// Update data by ID
app.put('/data/:_id', async (req, res) => {
    try {
        const id = req.params._id;
        const newData = req.body; // Updated data

        const [result] = await pool.query(
            'UPDATE files SET summarizedContent = ?, campaignId = ?, campaignName = ?, _id = ?, whitepaperHeading = ?, imagedomain = ?, Categories = ?, jobtitle = ?, wpimg = ?, pdfUrl = ?, privacylink = ?,check = ? WHERE _id = ?',
            [newData.summarizedContent, newData.campaignId, newData.campaignName, newData._id, newData.whitepaperHeading, newData.imagedomain, newData.Categories, newData.jobtitle, newData.wpimg, newData.pdfUrl, newData.privacylink,newData.check]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Data not found' });
        }

        res.json({ message: 'Data updated successfully', data: { _id, ...newData } });
    } catch (error) {
        console.error('Error updating data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get data by campaign name
app.get('/data/campaign/:campaignName', async (req, res) => {
    try {
        const campaignName = req.params.campaignName;
        const [rows] = await pool.query('SELECT * FROM files WHERE campaignName = ? ORDER BY _id DESC', [campaignName]);

        res.json(rows);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get data by category name
app.get('/data/cat/:Categories', async (req, res) => {
    try {
        const Categories = req.params.Categories;
        const [rows] = await pool.query('SELECT * FROM files WHERE Categories = ? ORDER BY _id DESC', [Categories]);

        res.json({ total: rows.length, data: rows });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get data by job title
app.get('/data/jt/:jobtitle', async (req, res) => {
    try {
        const jobtitle = req.params.jobtitle;
        console.log(`Fetching data for job title: ${jobtitle}`);

        const [rows] = await pool.query('SELECT * FROM files WHERE jobtitle = ? ORDER BY _id DESC', [jobtitle]);

        console.log('Fetched rows:', rows);

        res.json({ total: rows.length, data: rows });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// Get data by job title
app.get('/data/sjt/:subjobtitle', async (req, res) => {
    try {
        const subjobtitle = req.params.subjobtitle;
        console.log(`Fetching data for subjob title: ${subjobtitle}`);

        const [rows] = await pool.query('SELECT * FROM files WHERE subjobtitle = ? ORDER BY _id DESC', [subjobtitle]);

        console.log('Fetched rows:', rows);

        res.json({ total: rows.length, data: rows });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
