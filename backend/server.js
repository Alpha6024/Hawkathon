const app = require("./app");
const connectDB = require("./db/db");

connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Server Running on port", PORT);
});