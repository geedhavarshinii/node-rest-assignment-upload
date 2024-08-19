const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/checkAuth");
const Class = require("../models/class");
const mongoose = require("mongoose");

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "./uploads/");
//   },
//   filename: function (req, file, cb) {
//     const safeFileName =
//       new Date().toISOString().replace(/:/g, "-") + file.originalname;
//     cb(null, safeFileName);
//   },
// });

// const fileFilter = (req, file, cb) => {
//   if (
//     file.mimetype === "application/pdf" ||
//     file.mimetype === "application/msword" ||
//     file.mimetype ===
//       "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
//   ) {
//     cb(null, true);
//   } else {
//     cb(null, false);
//   }
// };

// const upload = multer({
//   storage: storage,
//   limits: {
//     fileSize: 1024 * 1024 * 5,
//   },
//   fileFilter: fileFilter,
// });

router.get("/", (req, res, next) => {
  Class.find()
    .select("_id teacher students")
    .exec()
    .then((docs) => {
      const response = {
        count: docs.length,
        classes: docs.map((doc) => {
          return {
            _id: doc.id,
            teacher: doc.teacher,
            students: doc.students,
            request: {
              type: "GET",
              url: "http://localhost:3000/classes" + doc._id,
            },
          };
        }),
      };
      res.status(200).json(response);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
});

router.post("/", (req, res, next) => {
  const new_class = new Class({
    _id: new mongoose.Types.ObjectId(),
    teacher: req.body.teacher,
    students: req.body.students,
  });
  new_class
    .save()
    .then((result) => {
      console.log(result);
      res.status(201).json({
        message: "Created class succesfully",
        createdClass: {
          _id: result._id,
          teacher: result.teacher,
          students: result.students,
          request: {
            type: "GET",
            url: "http://localhost:3000/classes/" + result._id,
          },
        },
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
});

router.get("/:classId", checkAuth, (req, res, next) => {
  const id = req.params.classId;
  Class.findById(id)
    .select("_id teacher students")
    .exec()
    .then((doc) => {
      console.log("From database: ", doc);
      if (doc) {
        res.status(200).json({
          new_class: doc,
          description: "Get all classes",
          url: "http://localhost:3000/classes",
        });
      } else {
        res.status(404).json({
          message: "No valid entry found for provided ID",
        });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: err });
    });
});

module.exports = router;
