// server.js - Complete Backend with Auth + Portfolio CRUD (FIXED)

const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Rate limiting - FIXED: More lenient for development
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 5 : 100, // 100 requests in dev, 5 in prod
  message: "Too many authentication attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for localhost in development
  skip: (req) =>
    process.env.NODE_ENV === "development" &&
    (req.ip === "::1" || req.ip === "127.0.0.1"),
});

// MongoDB Connection
mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/portfolio_builder",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ============================================
// SCHEMAS
// ============================================

// User Schema - FIXED: Better username validation
const userSchema = new mongoose.Schema({
  full_name: {
    type: String,
    required: [true, "Full name is required"],
    trim: true,
    minlength: [2, "Full name must be at least 2 characters"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
  },
  username: {
    type: String,
    required: [true, "Username is required"],
    unique: true,
    trim: true,
    minlength: [3, "Username must be at least 3 characters"],
    maxlength: [20, "Username cannot exceed 20 characters"],
    validate: {
      validator: function (v) {
        // Validate before lowercase conversion
        return /^[a-zA-Z0-9_]+$/.test(v);
      },
      message:
        "Username can only contain letters, numbers, and underscores (no spaces)",
    },
    // FIXED: Auto-sanitize username (remove spaces, convert to lowercase)
    set: function (v) {
      return v.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();
    },
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [8, "Password must be at least 8 characters"],
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  last_login: Date,
});

userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    {
      id: this._id,
      username: this.username,
      email: this.email,
    },
    process.env.JWT_SECRET || "your-secret-key-change-in-production",
    { expiresIn: "7d" }
  );
};

const User = mongoose.model("User", userSchema);

// Portfolio Schema
const portfolioSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
  },
  summary: {
    type: String,
    trim: true,
  },
  skills: {
    type: String,
    trim: true,
  },
  experience: {
    type: String,
    trim: true,
  },
  education: {
    type: String,
    trim: true,
  },
  linkedin: {
    type: String,
    trim: true,
  },
  github: {
    type: String,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

portfolioSchema.index({ user: 1 });

const Portfolio = mongoose.model("Portfolio", portfolioSchema);

// ============================================
// MIDDLEWARE
// ============================================

function verifyToken(req, res, next) {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided.",
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key-change-in-production"
    );
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
}

// ============================================
// AUTHENTICATION ROUTES
// ============================================

// Register - FIXED: Better error handling and validation
app.post("/api/auth/register", authLimiter, async (req, res) => {
  try {
    const { full_name, email, username, password, confirmPassword } = req.body;

    // Validate required fields
    if (!full_name || !email || !username || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // FIXED: Sanitize username before validation
    const sanitizedUsername = username.replace(/[^a-zA-Z0-9_]/g, "");

    if (sanitizedUsername.length < 3) {
      return res.status(400).json({
        success: false,
        message:
          "Username must be at least 3 characters (letters, numbers, and underscores only)",
      });
    }

    // Password match check
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    // Password strength validation
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 8 characters, one uppercase, one lowercase, one number, and one special character",
      });
    }

    // Check existing email
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Check existing username
    const existingUsername = await User.findOne({
      username: sanitizedUsername.toLowerCase(),
    });
    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: "Username already taken",
      });
    }

    // Create user
    const user = new User({
      full_name,
      email: email.toLowerCase(),
      username: sanitizedUsername, // Will be auto-sanitized and lowercased by schema
      password,
    });

    await user.save();

    const token = user.generateAuthToken();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        user: userResponse,
        token,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `${
          field.charAt(0).toUpperCase() + field.slice(1)
        } already exists`,
      });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
});

// Login
app.post("/api/auth/login", authLimiter, async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide username/email and password",
      });
    }

    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier.toLowerCase() },
      ],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    user.last_login = new Date();
    await user.save();

    const token = user.generateAuthToken();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: userResponse,
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
});

// Get current user
app.get("/api/auth/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// ============================================
// PORTFOLIO ROUTES (CRUD)
// ============================================

// Create Portfolio
app.post("/api/portfolios", verifyToken, async (req, res) => {
  try {
    const {
      title,
      summary,
      skills,
      experience,
      education,
      linkedin,
      github,
      phone,
    } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    const portfolio = new Portfolio({
      user: req.user.id,
      title,
      summary,
      skills,
      experience,
      education,
      linkedin,
      github,
      phone,
    });

    await portfolio.save();

    res.status(201).json({
      success: true,
      message: "Portfolio created successfully",
      data: portfolio,
    });
  } catch (error) {
    console.error("Create portfolio error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating portfolio",
    });
  }
});

// Get all portfolios for logged-in user
app.get("/api/portfolios", verifyToken, async (req, res) => {
  try {
    const portfolios = await Portfolio.find({ user: req.user.id }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      count: portfolios.length,
      data: portfolios,
    });
  } catch (error) {
    console.error("Get portfolios error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching portfolios",
    });
  }
});

// Get single portfolio
app.get("/api/portfolios/:id", verifyToken, async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: "Portfolio not found",
      });
    }

    res.json({
      success: true,
      data: portfolio,
    });
  } catch (error) {
    console.error("Get portfolio error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching portfolio",
    });
  }
});

// Update Portfolio
app.put("/api/portfolios/:id", verifyToken, async (req, res) => {
  try {
    const {
      title,
      summary,
      skills,
      experience,
      education,
      linkedin,
      github,
      phone,
    } = req.body;

    const portfolio = await Portfolio.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: "Portfolio not found",
      });
    }

    portfolio.title = title || portfolio.title;
    portfolio.summary = summary !== undefined ? summary : portfolio.summary;
    portfolio.skills = skills !== undefined ? skills : portfolio.skills;
    portfolio.experience =
      experience !== undefined ? experience : portfolio.experience;
    portfolio.education =
      education !== undefined ? education : portfolio.education;
    portfolio.linkedin = linkedin !== undefined ? linkedin : portfolio.linkedin;
    portfolio.github = github !== undefined ? github : portfolio.github;
    portfolio.phone = phone !== undefined ? phone : portfolio.phone;
    portfolio.updatedAt = Date.now();

    await portfolio.save();

    res.json({
      success: true,
      message: "Portfolio updated successfully",
      data: portfolio,
    });
  } catch (error) {
    console.error("Update portfolio error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating portfolio",
    });
  }
});

// Delete Portfolio
app.delete("/api/portfolios/:id", verifyToken, async (req, res) => {
  try {
    const portfolio = await Portfolio.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: "Portfolio not found",
      });
    }

    res.json({
      success: true,
      message: "Portfolio deleted successfully",
    });
  } catch (error) {
    console.error("Delete portfolio error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting portfolio",
    });
  }
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `🔒 Rate limiting: ${
      process.env.NODE_ENV === "production"
        ? "Strict (5 req/15min)"
        : "Lenient (100 req/15min)"
    }`
  );
});
