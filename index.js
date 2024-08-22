const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const TeacherRoutes = require("./routes/Teacherroutes");
const cors = require("cors"); // Add this line
require("dotenv").config();

const app = express();

// Add CORS middleware
app.use(cors({
    origin: function (origin, callback) {
        callback(null, true); // Allow all origins
    },
    credentials: true, // Allow cookies to be sent
}));


app.use(express.json());

mongoose.connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to Database");
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
  });

  app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // secure should be true if using HTTPS
  }));
app.use("/teacher", TeacherRoutes);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
