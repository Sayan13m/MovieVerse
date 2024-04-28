const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");

const app = express();
const PORT = 1234;
const SECRET = "SECr3t";

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware to authenticate JWT
const authenticateJwt = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, SECRET, (err, decoded) => {
      if (err) {
        return res.sendStatus(403);
      }
      // Extract every piece of information from the decoded token
      req.user = decoded;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

// MongoDB connection
mongoose.connect(
  "mongodb+srv://icsesayan:qwerty12345@cluster0.0woqf6b.mongodb.net/",
  { useNewUrlParser: true, useUnifiedTopology: true }
);

// Models
const userSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);



// Routes
// Signup route
app.post("/signup", async (req, res) => {
    const { fullname, email, password } = req.body;
    const user = await User.findOne({ email });
    const hashedPassword = bcryptjs.hashSync(password, 10);
  
    if (user) {
        res.status(403).json({ message: "Email already exists" });
    } else {
        const newUser = new User({ fullname, email, password: hashedPassword });
        await newUser.save();
        const token = jwt.sign({ id: newUser._id, email: newUser.email }, SECRET, {
            expiresIn: "1h",
        });
        console.log("signup succefull....")
        res.json({ message: "User created successfully", token });
    }
  });
  
  // Login route
  app.post("/users/login", async (req, res) => {
    console.log("enter")
    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const validPassword = bcryptjs.compareSync(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid Password" });
      }
      const token = jwt.sign({ id: user._id, email: user.email }, SECRET, {
        expiresIn: "1h",
      });
      console.log("login succefull....")
      res.status(200).json({ message: "Logged in successfully", token });
    } catch (error) {
        console.error("Error logging in:", error.message);
        res.status(500).json({ message: "Error logging in" });
    }
});

// Fetch user data route
app.get("/user/data", authenticateJwt, async (req, res) => {
    try {
        const userEmail = req.user.email;
        const user = await User.findOne({ email: userEmail });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    } catch (error) {
      console.error("Error fetching user data:", error.message);
      res.status(500).json({ message: "Error fetching user data" });
    }
  });
  
  // Fetch logged-in user route
  app.get("/users/me", authenticateJwt, async (req, res) => {
    res.json({ username: req.user.email });
  });
  
  app.post("/user/create/trial", async (req, res) => {
    try {
      const { title, createdBy, questionType } = req.body;
      const newQuiz = new Quiz({ title, createdBy, questionType });
      await newQuiz.save();
      res
        .status(201)
        .json({ message: "Quiz created successfully", quiz: newQuiz });
    } catch (error) {
      console.error("Error creating quiz:", error.message);
      res.status(500).json({ message: "Error creating quiz" });
    }
  });

  // Start the server
app.listen(PORT, () => {
    console.log(`Server running on Port ${PORT}`);
  });