const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");
const checkAuth = require("../middleware/checkAuth");

const Answer = require("../models/answers");
const Assignment = require("../models/assignments");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/answers");
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

router.get("/:assignmentId", checkAuth, async (req, res, next) => {
  try {
    const docs = await Answer.find({ assignment: req.params.assignmentId })
      .populate("student", "name email")
      .populate("assignment", "class dueDate");

    const response = {
      count: docs.length,
      answers: docs.map((doc) => {
        return {
          _id: doc._id,
          student: doc.student,
          uploadDate: doc.uploadDate,
          answerPaper: doc.answerPaper,
          request: {
            type: "GET",
            url: "http://localhost:3000/uploads/answers/" + doc.answerPaper,
          },
        };
      }),
    };

    res.status(200).json(response);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: err,
    });
  }
});

router.post("/", checkAuth, upload.single("answerPaper"), async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.body.assignment);

    if (!assignment) {
      return res.status(404).json({
        message: "Assignment not found",
      });
    }

    const currentDateTime = new Date().toISOString();
    if (new Date(currentDateTime) > new Date(assignment.dueDate)) {
      return res.status(400).json({
        message: "Cannot upload answer after the due date",
      });
    }

    const answer = new Answer({
      _id: new mongoose.Types.ObjectId(),
      assignment: req.body.assignment,
      student: req.body.student,
      uploadDate: currentDateTime,
      answerPaper: req.file.path,
    });

    const result = await answer.save();

    res.status(201).json({
      message: "Answer uploaded successfully",
      createdAnswer: {
        _id: result._id,
        assignment: result.assignment,
        student: result.student,
        uploadDate: result.uploadDate,
        answerPaper: result.answerPaper,
        request: {
          type: "GET",
          url: "http://localhost:3000/uploads/answers/" + result.answerPaper,
        },
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: err,
    });
  }
});

router.patch("/:answerId", checkAuth, upload.single("answerPaper"), async (req, res, next) => {
  try {
    const answer = await Answer.findById(req.params.answerId).populate("assignment", "dueDate");

    if (!answer) {
      return res.status(404).json({
        message: "Answer not found",
      });
    }

    const currentDateTime = new Date().toISOString();
    if (new Date(currentDateTime) > new Date(answer.assignment.dueDate)) {
      return res.status(400).json({
        message: "Cannot modify answer after the due date",
      });
    }

    answer.answerPaper = req.file.path;
    answer.uploadDate = currentDateTime;

    const result = await answer.save();

    res.status(200).json({
      message: "Answer updated successfully",
      request: {
        type: "GET",
        url: "http://localhost:3000/uploads/answers/" + result.answerPaper,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: err,
    });
  }
});

module.exports = router;
