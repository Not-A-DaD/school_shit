const express = require("express");
const dotenv = require("dotenv");
const z = require("zod");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// Load environment variables
dotenv.config();

// Import schemas
const { sign_up_schema, sign_up_otp_schema } = require("./db.js");

// Constants
const Jwt_Secret = process.env.JWT_SECRET || "School_comunity_website";
const app = express();

// Middleware
app.use(cors({
    origin: ["http://127.0.0.1:3000", "http://localhost:3000"], // Allow multiple origins
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

// Serve static files
app.use(express.static(path.join(__dirname, "../front-end")));
app.use(express.json());

// Zod validation schema
const signup_schema = z.object({
    Full_name: z.string().min(5).max(40).regex(/^[a-zA-Z0-9]+$/),
    username: z.string().min(3).max(15),
    email: z.string().email(),
    password: z.string().min(8).max(20),
});

// Middleware for token verification
function signup_verification(req, res, next) {
    try {
        const token = req.body.Token || req.query.Token;
        if (!token) {
            return res.status(400).json({
                success: false,
                message: "No token provided"
            });
        }

        const token_matching = jwt.verify(token, Jwt_Secret);
        
        if (token_matching) {
            // Store the decoded email in the request for later use
            req.verifiedEmail = jwt.decode(token);
            next();
        } else {
            return res.status(400).json({
                success: false,
                message: "Invalid token"
            });
        }
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Token verification failed"
        });
    }
}

// Signup route
app.post("/signup", async function(req, res) {
    try {
        const { Full_name, username, email, password } = req.body;

        // Validate input
        const safe_parse = signup_schema.safeParse(req.body);
        if (!safe_parse.success) {
            return res.status(400).json({
                success: false,
                error: safe_parse.error.issues
            });
        }

        // Create temporary token
        const temp_token = jwt.sign(email, Jwt_Secret);

        // Create user record
        await sign_up_schema.create({
            email: email,
            First_name: Full_name,
            Username: username,
            password: password,
        });

        // Send token back to client
        return res.status(200).json({
            success: true,
            Token: temp_token
        });
    } catch(e) {
        // Handle duplicate key errors
        if (e.code === 11000) {
            let errorMessage = "Not approved: ";
        
            if (e.keyPattern?.email) {
                errorMessage += "Email already exists, ";
            }
            if (e.keyPattern?.Username) {
                errorMessage += "Username already exists, ";
            }
        
            errorMessage = errorMessage.trim().replace(/,$/, ""); 
        
            return res.status(403).json({ 
                success: false,
                message: errorMessage 
            });
        }
        
        // Generic error handling
        console.error(e);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

// Signup verification route
app.post("/signup-verification", signup_verification, async function(req, res) {
    try {
        // Generate OTP
        const random_number = crypto.randomInt(1000, 9999);
        const sender_email = req.verifiedEmail;

        // Create email transporter
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com", 
            port: 587,
            secure: false,
            auth: {
                user: "bhushanritik4@gmail.com",
                pass: "wozjlrapksnktxgp",
            },
        });

        // Mail options
        const mailOptions = {
            from: "bhushanritik4@gmail.com",
            to: sender_email,
            subject: "Email Verification OTP",
            text: `Your verification OTP is: ${random_number}`
        };

        // Save OTP to database
        await sign_up_otp_schema.create({
            email: sender_email, 
            otp: random_number
        });

        // Send email
        await new Promise((resolve, reject) => {
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log("Email sending error:", error);
                    reject(error);
                } else {
                    console.log("Email sent:", info.response);
                    resolve(info);
                }
            });
        });

        // Send JSON response instead of redirect
        return res.status(200).json({
            success: true,
            message: "OTP sent successfully",
            redirectUrl: "/landing_page/sign-up/verifcation/index.html"
        });
    } catch (error) {
        console.error("Verification error:", error);
        return res.status(500).json({ 
            success: false,
            message: "Failed to send OTP email" 
        });
    }
});

// OTP Verification route
app.post("/signup-verification-home_page", signup_verification, async function (req, res) {
    try {
        const { Token, otp } = req.body;
        const email = req.verifiedEmail;

        // Find OTP for the email
        const otp_info = await sign_up_otp_schema.findOne({ email });

        if (!otp_info) {
            return res.status(400).json({
                success: false,
                message: "No OTP found for this email"
            });
        }

        // Compare OTPs
        if (otp_info.otp.toString() === otp.toString()) {
            // OTP verified
            return res.status(200).json({
                success: true,
                message: "Welcome back!",
                redirectUrl: "/homepage"
            });
        } else {
            // Incorrect OTP
            return res.status(400).json({
                success: false,
                message: "Incorrect OTP",
                redirectUrl: "/landing_page/sign-up/verifcation/index.html"
            });
        }
    } catch (error) {
        console.error("Verification home page error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

// Database connection
mongoose.connect(
    "mongodb+srv://bhushanritik4:9234611798%40@school-comunity.lgryr.mongodb.net/school_community?retryWrites=true&w=majority&appName=School-Comunity", 
    { 
        useNewUrlParser: true, 
        useUnifiedTopology: true 
    }
).then(() => {
    console.log("Connected to MongoDB");
}).catch((error) => {
    console.error("MongoDB connection error:", error);
});

// Start server
const port = process.env.PORT || 2000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

module.exports = app;
