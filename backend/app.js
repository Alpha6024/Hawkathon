const express = require("express");
const { usermodel } = require("./db/model");
const cors = require("cors");
require("dotenv").config();
const app = express();

app.use(cors());
app.use(express.json());


module.exports = app;