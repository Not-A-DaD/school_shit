const moongose = require("mongoose")
// const { default: mongoose } = require("mongoose")
const objectid = moongose.Types.Objectid

const schema = moongose.Schema


const sign_up = ({
    email : {type: String, unique:true},
    First_name : {type : String}, 
    Username : {type:String, unique: true},
    password : {type: String},
})

const sign_up_otp = ({
    token : {type : String},
    otp : {type : Number},
})

let sign_up_schema = moongose.model("user_account",sign_up);
let sign_up_otp_schema = moongose.model("temp_otp",sign_up_otp)

module.exports = {
    sign_up_schema : sign_up_schema,
    sign_up_otp_schema : sign_up_otp_schema
}

