const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/checkAuth");
const Teacher = require("../models/teachers");
const { default: mongoose } = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Get all teachers
router.get("/", async (req, res) => {
  try {
    const teachers = await Teacher.find().exec();
    res.status(200).json({ teachers });
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// Get a teacher by ID
router.get("/:teacherId", async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.teacherId).exec();
    if (teacher) {
      res.status(200).json({ teacher });
    } else {
      res.status(404).json({ message: "Teacher not found" });
    }
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// Teacher signup
router.post("/signup", async (req, res) => {
  try {
    const existingTeacher = await Teacher.find({ email: req.body.email }).exec();
    if (existingTeacher.length >= 1) {
      return res.status(409).json({ message: "Mail exists" });
    }

    const hash = await bcrypt.hash(req.body.password, 10);
    const teacher = new Teacher({
      _id: new mongoose.Types.ObjectId(),
      name: req.body.name,
      email: req.body.email,
      password: hash,
    });

    const result = await teacher.save();
    console.log(result);
    res.status(201).json({ message: "Teacher profile created" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err });
  }
});

// Teacher login
router.post("/login", async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ email: req.body.email }).exec();
    if (!teacher) {
      return res.status(401).json({ message: "Auth failed" });
    }

    const isMatch = await bcrypt.compare(req.body.password, teacher.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Auth failed" });
    }

    const token = jwt.sign(
      {
        email: teacher.email,
        teacherId: teacher._id,
      },
      process.env.JWT_KEY,
      {
        expiresIn: "24h",
      }
    );

    res.status(200).json({
      message: "Auth successful",
      token: token,
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// Delete a teacher
router.delete("/:teacherId", checkAuth, async (req, res) => {
  try {
    await Teacher.deleteOne({ _id: req.params.teacherId }).exec();
    res.status(200).json({ message: "Teacher deleted" });
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

module.exports = router;
