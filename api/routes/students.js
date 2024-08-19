const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const checkAuth = require("../middleware/checkAuth");

const Student = require("../models/student");

router.get("/", (req, res) => {
  Student.find()
    .exec()
    .then((students) => {
        res.status(200).json({
            students: students
        })
    })
    .catch(err => {
        res.status(500).json({
            error: err
        })
    });
});
router.get("/:studentId", (req, res) => {
  Student.findById(req.params.studentId)
    .exec()
    .then((student) => {
        res.status(200).json({
            student: student
        })
    })
    .catch(err => {
        res.status(500).json({
            error: err
        })
    });
});

router.post("/signup", (req, res) => {
  Student.find({ email: req.body.email })
    .exec()
    .then((student) => {
      if (student.length >= 1) {
        return res.status(409).json({
          message: "Mail exists",
        });
      } else {
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          if (err) {
            return res.status(500).json({
              error: err,
            });
          } else {
            const student = new Student({
              _id: new mongoose.Types.ObjectId(),
              name: req.body.name,
              email: req.body.email,
              password: hash,
            });
            student
              .save()
              .then((result) => {
                console.log(result);
                res.status(201).json({
                  message: "Student profile created",
                });
              })
              .catch((err) => {
                console.log(err);
                res.status(500).json({
                  error: err,
                });
              });
          }
        });
      }
    });
});

router.post("/login", (req, res, next) => {
  Student.findOne({ email: req.body.email })
    .exec()
    .then((student) => {
      if (!student) {
        return res.status(401).json({
          message: "Auth failed",
        });
      }
      bcrypt.compare(req.body.password, student.password, (err, result) => {
        if (err) {
          return res.status(401).json({
            message: "Auth failed",
          });
        }
        if (result) {
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
          return res.status(200).json({
            message: "Auth successful",
            token: token,
          });
        }
        res.status(401).json({
          message: "Auth failed",
        });
      });
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
      });
    });
});

router.delete("/:studentId", checkAuth, (req, res, next) => {
  Student.deleteOne({ _id: req.params.studentId })
    .exec()
    .then((result) => {
      res.status(200).json({
        message: "Student deleted",
      });
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
      });
    });
});

module.exports = router;
