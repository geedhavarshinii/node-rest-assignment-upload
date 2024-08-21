const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const checkAuth = require("../middleware/checkAuth");
const multer = require("multer");

const Assignment = require("../models/assignments");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/assignments");
  },
  filename: function (req, file, cb) {
    const safeFileName =
      new Date().toISOString().replace(/:/g, "-") + file.originalname;
    cb(null, safeFileName);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "application/pdf" ||
    file.mimetype === "application/msword" ||
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
  fileFilter: fileFilter,
});

router.get("/", (req, res, next) => {
  Assignment.find()
    .select("_id title class questionPaper dueDate")
    .then((docs) => {
      const response = {
        count: docs.length,
        assignments: docs.map((doc) => {
          return {
            _id: doc._id,
            title: doc.title, 
            class: doc.class,
            questionPaper: doc.questionPaper,
            dueDate: doc.dueDate,
            request: {
              type: "GET",
              url: "http://localhost:3000/assignments/" + doc._id,
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

router.get("/:assignmentId", (req, res, next) => {
  Assignment.findById(req.params.assignmentId)
    .select("_id title class questionPaper dueDate")
    .then((doc) => {
      if (!doc) {
        return res.status(404).json({
          message: "Assignment not found",
        });
      }
      res.status(200).json({
        _id: doc._id,
        title: doc.title, 
        class: doc.class,
        questionPaper: doc.questionPaper,
        dueDate: doc.dueDate,
        request: {
          type: "GET",
          url: "http://localhost:3000/uploads/assignments/" + doc.questionPaper,
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

router.post("/", upload.single("questionPaper"), (req, res, next) => {
  const assignment = new Assignment({
    _id: new mongoose.Types.ObjectId(),
    title: req.body.title,
    class: req.body.class,
    questionPaper: req.file.path,
    dueDate: req.body.dueDate,
  });
  assignment
    .save()
    .then((result) => {
      console.log(result);
      res.status(201).json({
        message: "Created assignment successfully",
        createdAssignment: {
          _id: result._id,
          title: result.title, 
          class: result.class,
          questionPaper: result.questionPaper,
          dueDate: result.dueDate,
          request: {
            type: "GET",
            url: "http://localhost:3000/assignments/" + result._id,
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

router.patch(
  "/:assignmentId",
  checkAuth,
  upload.single("questionPaper"),
  (req, res, next) => {
    const id = req.params.assignmentId;
    const updateOps = {};

    if (req.body.title) {
      updateOps.title = req.body.title;
    }
    if (req.body.dueDate) {
      updateOps.dueDate = req.body.dueDate; 
    }
    if (req.file) {
      updateOps.questionPaper = req.file.path;
    }

    Assignment.updateOne({ _id: id }, { $set: updateOps })
      .exec()
      .then((result) => {
        res.status(200).json({
          message: "Assignment updated",
          request: {
            type: "GET",
            url: "http://localhost:3000/assignments/" + id,
          },
        });
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({
          error: err,
        });
      });
  }
);

module.exports = router;
