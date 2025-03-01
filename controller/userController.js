const bcrypt= require('bcrypt');

const jwt=require('jsonwebtoken');
const db = require('../config/db');
const {v4:uuidv4}=require('uuid')
const dotenv = require('dotenv');

dotenv.config();

exports.register = async (req, res) => {
    try {
        const { email, name, mobile_number, city, referral_code, password } = req.body;

        if (!email || !name || !mobile_number || !city || !password) {
            return res.status(400).json({ message: 'All fields except referral code are required' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userReferralCode = uuidv4().slice(0, 8);
        let referred_by = null;  // Default to null
        if (referral_code) {
            const [referrer] = await db.promise().query(
                'SELECT id FROM users WHERE referral_code = ?', [referral_code]
            );
        
            if (referrer.length === 0) {
                return res.status(400).json({ message: 'Invalid referral code' });
            }
        
            referred_by = referrer[0].id;  // ✅ Assign the referrer's ID
        }
        
        await db.promise().query(
            'INSERT INTO users (email, name, mobile_number, city, password, referral_code, referred_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [email, name, mobile_number, city, hashedPassword, userReferralCode, referred_by]  // ✅ Pass referred_by correctly
        );
        

        res.status(201).json({ message: 'User registered successfully', referralCode: userReferralCode });

    } catch (error) {
        console.error('Error in register:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};




exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // ✅ Validate input
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // ✅ Check if user exists
        const [user] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
        if (user.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // ✅ Validate password
        const isMatch = await bcrypt.compare(password, user[0].password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // ✅ Generate JWT token
        const token = jwt.sign({ userId: user[0].id, email: user[0].email }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // ✅ Return userId, email, and token
        res.json({ userId: user[0].id, email: user[0].email, token });

    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


exports.getReferrals = async (req, res) => {
    try {
        const { referral_code } = req.query;
        
        if (!referral_code) {
            return res.status(400).json({ error: "Referral Code is required" });
        }

        const [users] = await db.promise().query(
            "SELECT name, email , created_at FROM Users WHERE id = ?", 
            [referral_code]
        );

        return res.status(200).json({
            success: true,
            message: users.length ? "Referrals fetched successfully." : "No referrals found.",
            referrals: users
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false,
            error: "Internal Server Error",
            details: error.message 
        });
    }
};




