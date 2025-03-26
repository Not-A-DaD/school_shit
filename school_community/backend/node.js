const express = require("express")
const dontenv = require("dotenv")
const z = require("zod")
const path = require("path");
const dotenv = require("dotenv")
const cors = require("cors")

dotenv.config()

const {sign_up_schema, sign_up_otp_schema} = require("./db.js")
const { default: mongoose } = require("mongoose")
const jwt = require("jsonwebtoken")
const crypto = require("crypto");
const nodemailer = require("nodemailer")


const Jwt_Secret = "School_comunity_website"
const app = express();

// Serve static files from the "front" folder located in the parent directory





app.use(cors({
    origin: "http://127.0.0.1:3000", // Allow your front-end origin
    methods: ["GET", "POST", "PUT", "DELETE"]
  }));
app.use(express.static(path.join(__dirname, "../front-end")));


dontenv.config()
mongoose.connect("mongodb+srv://bhushanritik4:9234611798%40@school-comunity.lgryr.mongodb.net/school_community?retryWrites=true&w=majority&appName=School-Comunity")
app.use(express.json())


const signup_schema = z.object({
    Full_name : z.string().min(5).max(40).regex(/^[a-zA-Z0-9]+$/),
    username : z.string().min(3).max(15),
    email : z.string().email(),
    password : z.string().min(8).max(20),

})


function signup_verification (req,res,next) {

    let token = req.body.Token
    console.log(token)

    let token_matching = jwt.verify(token,Jwt_Secret)

    if(token_matching) {
        res.redirect(path.join(__dirname,"../front-end/landing_page/user_signup_verification/index.html"))
        next()
    }
    else {
        res.status(400).json({
            message : "token not valid"
         })
    }
    
    // res.redirect()

}

app.post("/signup", async function(req,res){
    let First_name = req.body.Full_name 
    let Username = req.body.username
    let email = req.body.email 
    let password = req.body.password

    console.log(First_name)
    console.log(Username)
    console.log(email)
    console.log(password)

    let safe_parse = signup_schema.safeParse(req.body)

    if (!safe_parse.success) {
        console.log("user failed to signup")
        res.status(403).json({
            error : safe_parse.error
        })
    }
    console.log("safeparse done")

    try{
        let temp_token = jwt.sign(email,Jwt_Secret)

        await sign_up_schema.create({
            email : email,
            First_name : First_name,
            Username : Username,
            password : password,
        })
        console.log("hey")


    
        console.log(temp_token)

        console.log("acc creation")
        res.status(200).json({
            "Token" : temp_token
        })
    } catch(e) {
        console.log(e)
        if (e.code === 11000) {
            let errorMessage = "Not approved: ";
        
            if (e.keyPattern?.email) {

                errorMessage += "Email already exists, ";
            }
            if (e.keyPattern?.Username) {
                errorMessage += "Username already exists, ";
            }
        
            errorMessage = errorMessage.trim().replace(/,$/, ""); 
        
            return res.status(403).json({ message: errorMessage });
        }
        
    }
  
})

app.post("/signup-verification", signup_verification, async function(req, res) {
    let random_number = crypto.randomInt(1000, 9999);
    let sender_email = jwt.decode(req.body.Token);

    console.log(sender_email)

    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com", 
        port: 587,
        secure: false,
        auth: {
            user: "bhushanritik4@gmail.com",
            pass: "wozjlrapksnktxgp",
        },
    });

    const mailOptions = {
        from: "bhushanritik4@gmail.com",
        to: sender_email,
        subject: "Email Verification OTP",
        text: random_number.toString()
    };

    try {
        await sign_up_otp_schema.create({
            email: sender_email, 
            otp: random_number
        });
    } catch (err) {
        console.error("Error saving OTP:", err);
        return res.status(500).json({ message: "Error saving OTP" });
    }

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log("Email sending error:", error);
            return res.status(500).json({ message: "Failed to send OTP email" });
        } else {
            console.log("Email sent:", info.response);
            // Instead of sending the file directly, send the URL as JSON.
            return res.status(200).json({
                message: "OTP sent successfully",
                redirectUrl: "front-end/landing_page/sign-up/verifcation/index.html"
            });
        }
    });
});

app.get("/signup-verification-home_page",signup_verification,async function (req,res){
    let token = req.body.Token
    let OTP = req.body.otp
    
    let otp_info = sign_up_otp_schema.findOne({
        email : Token
    })

    if (otp_info.otp === OTP) {
        res.redirect("//homepage")
        res.status(200).json({
            message : "welcome back!"
        })
        user
    }
    else {
        res.json({
            message : "acces did not granted",
            redirectUrl: "/landing_page/sign-up/verifcation/index.html"
        })
    }
    
}) 
port = process.env.port || 2000;
app.listen(2000)