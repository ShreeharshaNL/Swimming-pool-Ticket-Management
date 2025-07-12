const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const stripe = require('stripe');
require('dotenv').config();

const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Stripe
const stripeInstance = stripe(process.env.STRIPE_SECRET_KEY);

// Middleware
app.use(cors());
app.use(express.json());

// JWT middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Routes

// User Registration
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password, fullName, phone } = req.body;

        // Check if user already exists
        const [existingUsers] = await db.execute(
            'SELECT id FROM users WHERE email = ? OR username = ?',
            [email, username]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Insert user
        const [result] = await db.execute(
            'INSERT INTO users (username, email, password_hash, full_name, phone) VALUES (?, ?, ?, ?, ?)',
            [username, email, hashedPassword, fullName, phone]
        );

        const token = jwt.sign(
            { userId: result.insertId, username, email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: result.insertId,
                username,
                email,
                fullName,
                phone
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const [users] = await db.execute(
            'SELECT id, username, email, password_hash, full_name, phone FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const user = users[0];

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user.id, username: user.username, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                fullName: user.full_name,
                phone: user.phone
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get Pass Types
app.get('/api/pass-types', async (req, res) => {
    try {
        const [passTypes] = await db.execute(
            'SELECT id, name, description, price, duration_days FROM pass_types ORDER BY duration_days'
        );
        res.json(passTypes);
    } catch (error) {
        console.error('Error fetching pass types:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create Payment Intent
app.post('/api/payments/create-intent', authenticateToken, async (req, res) => {
    try {
        const { passTypeId } = req.body;
        const userId = req.user.userId;

        // Get pass type details
        const [passTypes] = await db.execute(
            'SELECT name, price FROM pass_types WHERE id = ?',
            [passTypeId]
        );

        if (passTypes.length === 0) {
            return res.status(404).json({ error: 'Pass type not found' });
        }

        const passType = passTypes[0];
        const amount = Math.round(passType.price * 100); // Convert to cents

        // Create payment intent with Stripe
        const paymentIntent = await stripeInstance.paymentIntents.create({
            amount,
            currency: 'usd',
            metadata: {
                userId: userId.toString(),
                passTypeId: passTypeId.toString(),
                passTypeName: passType.name
            }
        });

        res.json({
            clientSecret: paymentIntent.client_secret,
            amount: amount,
            currency: 'usd'
        });
    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({ error: 'Server error' });
    }
});


// Mock Payment Processing (India-friendly)
app.post('/api/payments/mock-process', authenticateToken, async (req, res) => {
    try {
        const { paymentId, passTypeId, amount } = req.body;
        const userId = req.user.userId;

        // Get pass type details
        const [passTypes] = await db.execute(
            'SELECT name, price, duration_days FROM pass_types WHERE id = ?',
            [passTypeId]
        );

        if (passTypes.length === 0) {
            return res.status(404).json({ error: 'Pass type not found' });
        }

        const passType = passTypes[0];
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + passType.duration_days);

        // Generate unique QR code data
        const qrData = {
            userId: userId,
            passId: uuidv4(),
            passType: passType.name,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            timestamp: Date.now()
        };

        const qrCodeData = JSON.stringify(qrData);

        // Insert payment record (mock)
        const [paymentResult] = await db.execute(
            'INSERT INTO payments (user_id, pass_type_id, amount, payment_method, payment_intent_id, status) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, passTypeId, passType.price, 'mock_payment', paymentId, 'completed']
        );

        // Insert user pass
        const [passResult] = await db.execute(
            'INSERT INTO user_passes (user_id, pass_type_id, start_date, end_date, qr_code_data, payment_id) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, passTypeId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0], qrCodeData, paymentResult.insertId]
        );

        // Generate QR code image
        const qrCodeImage = await QRCode.toDataURL(qrCodeData);

        res.json({
            message: 'Mock payment successful and pass created',
            pass: {
                id: passResult.insertId,
                passType: passType.name,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                qrCode: qrCodeImage,
                qrData: qrData
            }
        });
    } catch (error) {
        console.error('Error processing mock payment:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Process Payment and Create Pass
app.post('/api/payments/process', authenticateToken, async (req, res) => {
    try {
        const { paymentIntentId, passTypeId } = req.body;
        const userId = req.user.userId;

        // Retrieve payment intent from Stripe
        const paymentIntent = await stripeInstance.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status !== 'succeeded') {
            return res.status(400).json({ error: 'Payment not successful' });
        }

        // Get pass type details
        const [passTypes] = await db.execute(
            'SELECT name, price, duration_days FROM pass_types WHERE id = ?',
            [passTypeId]
        );

        if (passTypes.length === 0) {
            return res.status(404).json({ error: 'Pass type not found' });
        }

        const passType = passTypes[0];
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + passType.duration_days);

        // Generate unique QR code data
        const qrData = {
            userId: userId,
            passId: uuidv4(),
            passType: passType.name,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            timestamp: Date.now()
        };

        const qrCodeData = JSON.stringify(qrData);

        // Insert payment record
        const [paymentResult] = await db.execute(
            'INSERT INTO payments (user_id, pass_type_id, amount, payment_method, payment_intent_id, status) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, passTypeId, passType.price, 'stripe', paymentIntentId, 'completed']
        );

        // Insert user pass
        const [passResult] = await db.execute(
            'INSERT INTO user_passes (user_id, pass_type_id, start_date, end_date, qr_code_data, payment_id) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, passTypeId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0], qrCodeData, paymentResult.insertId]
        );

        // Generate QR code image
        const qrCodeImage = await QRCode.toDataURL(qrCodeData);

        res.json({
            message: 'Payment successful and pass created',
            pass: {
                id: passResult.insertId,
                passType: passType.name,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                qrCode: qrCodeImage,
                qrData: qrData
            }
        });
    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get User Passes
app.get('/api/user-passes', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        const [passes] = await db.execute(`
            SELECT 
                up.id,
                up.start_date,
                up.end_date,
                up.status,
                up.qr_code_data,
                up.created_at,
                pt.name as pass_type_name,
                pt.price,
                pt.duration_days
            FROM user_passes up
            JOIN pass_types pt ON up.pass_type_id = pt.id
            WHERE up.user_id = ?
            ORDER BY up.created_at DESC
        `, [userId]);

        // Generate QR codes for active passes
        const passesWithQR = await Promise.all(passes.map(async (pass) => {
            let qrCodeImage = null;
            if (pass.status === 'active' && new Date(pass.end_date) > new Date()) {
                qrCodeImage = await QRCode.toDataURL(pass.qr_code_data);
            }
            return {
                ...pass,
                qrCode: qrCodeImage
            };
        }));

        res.json(passesWithQR);
    } catch (error) {
        console.error('Error fetching user passes:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Verify QR Code (for staff)
app.post('/api/verify-qr', async (req, res) => {
    try {
        const { qrData, staffId } = req.body;

        let parsedData;
        try {
            parsedData = JSON.parse(qrData);
        } catch (error) {
            return res.status(400).json({ error: 'Invalid QR code format' });
        }

        // Find the pass
        const [passes] = await db.execute(`
            SELECT 
                up.id,
                up.user_id,
                up.start_date,
                up.end_date,
                up.status,
                pt.name as pass_type_name,
                u.full_name,
                u.email
            FROM user_passes up
            JOIN pass_types pt ON up.pass_type_id = pt.id
            JOIN users u ON up.user_id = u.id
            WHERE up.qr_code_data = ? AND up.status = 'active'
        `, [qrData]);

        if (passes.length === 0) {
            return res.status(404).json({ error: 'Invalid or expired pass' });
        }

        const pass = passes[0];
        const currentDate = new Date();
        const endDate = new Date(pass.end_date);

        if (currentDate > endDate) {
            // Update pass status to expired
            await db.execute(
                'UPDATE user_passes SET status = ? WHERE id = ?',
                ['expired', pass.id]
            );
            return res.status(400).json({ error: 'Pass has expired' });
        }

        // Log the entry
        await db.execute(
            'INSERT INTO pool_entries (user_pass_id, user_id, staff_id) VALUES (?, ?, ?)',
            [pass.id, pass.user_id, staffId || 'staff']
        );

        res.json({
            message: 'Access granted',
            user: {
                name: pass.full_name,
                email: pass.email,
                passType: pass.pass_type_name,
                validUntil: pass.end_date
            }
        });
    } catch (error) {
        console.error('Error verifying QR code:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get Pool Entries (for analytics)
app.get('/api/pool-entries', authenticateToken, async (req, res) => {
    try {
        const [entries] = await db.execute(`
            SELECT 
                pe.id,
                pe.entry_time,
                pe.staff_id,
                u.full_name,
                u.email,
                pt.name as pass_type_name
            FROM pool_entries pe
            JOIN users u ON pe.user_id = u.id
            JOIN user_passes up ON pe.user_pass_id = up.id
            JOIN pass_types pt ON up.pass_type_id = pt.id
            ORDER BY pe.entry_time DESC
            LIMIT 100
        `);

        res.json(entries);
    } catch (error) {
        console.error('Error fetching pool entries:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});