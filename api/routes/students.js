const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const checkAuth = require("../middleware/checkAuth");

const Student = require("../models/students");

// Get all students
router.get("/", async (req, res) => {
  try {
    const students = await Student.find().exec();
    res.status(200).json({ students });
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// Get a student by ID
router.get("/:studentId", async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId).exec();
    res.status(200).json({ student });
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// Student signup
router.post("/signup", async (req, res) => {
  try {
    const existingStudent = await Student.find({
      email: req.body.email,
    }).exec();
    if (existingStudent.length >= 1) {
      return res.status(409).json({ message: "Mail exists" });
    }

    const hash = await bcrypt.hash(req.body.password, 10);
    const student = new Student({
      _id: new mongoose.Types.ObjectId(),
      name: req.body.name,
      email: req.body.email,
      password: hash,
    });

    const result = await student.save();
    console.log(result);
    res.status(201).json({ message: "Student profile created" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err });
  }
});

// Student login
router.post("/login", async (req, res) => {
  try {
    const student = await Student.findOne({ email: req.body.email }).exec();
    if (!student) {
      return res.status(401).json({ message: "Auth failed" });
    }

    const isMatch = await bcrypt.compare(req.body.password, student.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Auth failed" });
    }

    const token = jwt.sign(
      {
        email: student.email,
        studentId: student._id,
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

// Delete a student
router.delete("/:studentId", checkAuth, async (req, res) => {
  try {
    await Student.deleteOne({ _id: req.params.studentId }).exec();
    res.status(200).json({ message: "Student deleted" });
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

module.exports = router;
