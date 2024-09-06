const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const checkAuth = require("../middleware/checkAuth");
const multer = require("multer");
const { body, validationResult } = require("express-validator");
const fs = require("fs");
const path = require("path");

const Assignment = require("../models/assignments");

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/assignments");
  },
  filename: function (req, file, cb) {
    const safeFileName = new Date().toISOString().replace(/:/g, "-") + path.extname(file.originalname);
    cb(null, safeFileName);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "application/pdf" ||
    file.mimetype === "application/msword" ||
    file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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

// Get all assignments
router.get("/", async (req, res) => {
  try {
    const docs = await Assignment.find().select("_id title class questionPaper dueDate");

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
            url: `${req.protocol}://${req.get("host")}/assignments/${doc._id}`,
          },
        };
      }),
    };

    res.status(200).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "An error occurred while fetching assignments.",
      error: err.message,
    });
  }
});

// Get a specific assignment by ID
router.get("/:assignmentId", async (req, res) => {
  try {
    const doc = await Assignment.findById(req.params.assignmentId).select("_id title class questionPaper dueDate");

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
        url: `${req.protocol}://${req.get("host")}/uploads/assignments/${path.basename(doc.questionPaper)}`,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "An error occurred while fetching the assignment.",
      error: err.message,
    });
  }
});

// Create a new assignment
router.post(
  "/",
  checkAuth,
  [
    body("title").notEmpty().withMessage("Title is required."),
    body("class").notEmpty().withMessage("Class is required."),
    body("dueDate").isISO8601().withMessage("Due date must be a valid date."),
  ],
  upload.single("questionPaper"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const assignment = new Assignment({
        _id: new mongoose.Types.ObjectId(),
        title: req.body.title,
        class: req.body.class,
        questionPaper: req.file.path,
        dueDate: req.body.dueDate,
      });

      const result = await assignment.save();

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
            url: `${req.protocol}://${req.get("host")}/assignments/${result._id}`,
          },
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        message: "An error occurred while creating the assignment.",
        error: err.message,
      });
    }
  }
);

// Update assignment details
router.patch(
  "/:assignmentId",
  checkAuth,
  [
    body("title").optional().notEmpty().withMessage("Title cannot be empty."),
    body("dueDate").optional().isISO8601().withMessage("Due date must be a valid date."),
  ],
  upload.single("questionPaper"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const id = req.params.assignmentId;
      const updateOps = {};

      if (req.body.title) {
        updateOps.title = req.body.title;
      }
      if (req.body.dueDate) {
        updateOps.dueDate = req.body.dueDate;
      }
      if (req.file) {
        const assignment = await Assignment.findById(id);
        if (assignment && assignment.questionPaper) {
          fs.unlinkSync(path.join(__dirname, "../", assignment.questionPaper)); // Delete old file
        }
        updateOps.questionPaper = req.file.path;
      }

      await Assignment.findByIdAndUpdate(id, updateOps);

      res.status(200).json({
        message: "Assignment updated",
        request: {
          type: "GET",
          url: `${req.protocol}://${req.get("host")}/assignments/${id}`,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        message: "An error occurred while updating the assignment.",
        error: err.message,
      });
    }
  }
);

module.exports = router;
