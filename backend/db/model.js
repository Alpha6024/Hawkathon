const mongoose = require("mongoose");
const Userschema = new mongoose.Schema({
    
})
const usermodel = mongoose.model("user", Userschema);
module.exports = { usermodel };