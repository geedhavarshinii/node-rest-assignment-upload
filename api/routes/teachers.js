const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/checkAuth");
const Teacher = require("../models/teacher");
const { default: mongoose } = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

router.get("/", (req, res) => {
  Teacher.find()
    .exec()
    .then((teachers) => {
        res.status(200).json({
            teachers: teachers
        })
    })
    .catch(err => {
        res.status(500).json({
            error: err
        })
    });
});
router.get("/:teacherId", (req, res) => {
  Teacher.findById(req.params.teacherId)
    .exec()
    .then((teacher) => {
        res.status(200).json({
            teacher: teacher
        })
    })
    .catch(err => {
        res.status(500).json({
            error: err
        })
    });
});

router.post("/signup", (req, res, next) => {
    Teacher.find({email: req.body.email}).exec().then((teacher) => {
        if (user.length >= 1){
            return res.status(409).json({
                message: "Mail exists"
            });
        } else {
            bcrypt.hash(req.body.password, 10, (err, hash) => {
                if (err){
                    return res.status(500).json({
                        error: err,
                    })
                } else {
                    const teacher = new Teacher({
                        _id: new mongoose.Types.ObjectId(),
                        name: req.body.name,
                        email: req.body.email,
                        password: hash,
                    });
                    teacher.save().then((result) => {
                        console.log(result);
                        res.status(201).json({
                            message: "Teacher profile created"
                        })
                    }).catch((err) => {
                        console.log(err);
                        res.status(500).json({
                            error: err,
                        })
                    })
                }
            })
        }
    })
})

router.post("login", (req, res, next) => {
    Teacher.findOne({ email: req.body.email })
      .exec()
      .then((teacher) => {
        if (teacher.length < 1) {
          return res.status(401).json({
            message: "Auth failed",
          });
        }
        bcrypt.compare(req.body.password, teacher.password, (err, result) => {
          if (err) {
            return res.status(401).json({
              message: "Auth failed",
            });
          }
          if (result) {
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
      .catch();
  });
  
  router.delete("/:teacherId", checkAuth, (req, res, next) => {
    Teacher.deleteOne({ _id: req.params.teacherId })
      .exec()
      .then((result) => {
        res.status(200).json({
          message: "Teacher deleted",
        });
      })
      .catch((err) => {
        res.status(500).json({
          error: err,
        });
      });
  });

  module.exports = router;
  
