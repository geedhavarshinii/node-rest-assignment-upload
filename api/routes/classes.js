const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/checkAuth");
const Class = require("../models/classes");
const mongoose = require("mongoose");

router.get("/", checkAuth, (req, res, next) => {
  Class.find()
    .select("_id subject teacher students")
    .exec()
    .then((docs) => {
      const response = {
        count: docs.length,
        classes: docs.map((doc) => {
          return {
            _id: doc._id,
            subject: doc.subject,
            teacher: doc.teacher,
            students: doc.students,
            request: {
              type: "GET",
              url: "http://localhost:3000/classes/" + doc._id,
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

router.post("/", checkAuth, (req, res, next) => {
  const new_class = new Class({
    _id: new mongoose.Types.ObjectId(),
    subject: req.body.subject,
    teacher: req.body.teacher,
    students: req.body.students,
  });
  new_class
    .save()
    .then((result) => {
      console.log(result);
      res.status(201).json({
        message: "Created class successfully",
        createdClass: {
          _id: result._id,
          subject: result.subject,
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
    .select("_id subject teacher students")
    .exec()
    .then((doc) => {
      if (doc) {
        res.status(200).json({
          class: doc,
          request: {
            type: "GET",
            url: "http://localhost:3000/classes",
          },
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

router.delete("/:classId", checkAuth, (req, res, next) => {
  const id = req.params.classId;

  Class.findById(id)
    .select("teacher students subject")
    .exec()
    .then((classData) => {
      if (!classData) {
        return res.status(404).json({
          message: "Class not found",
        });
      }

      if (classData.teacher.toString() !== req.userData.userId) {
        return res.status(403).json({
          message: "You are not authorized to delete this class",
        });
      }

      return Class.deleteOne({ _id: id })
        .exec()
        .then(() => {
          res.status(200).json({
            message: "Class deleted",
            deletedClass: {
              _id: id,
              subject: classData.subject,
              teacher: classData.teacher,
              students: classData.students,
            },
            request: {
              type: "POST",
              url: "http://localhost:3000/classes",
              body: {
                subject: classData.subject,
                teacher: classData.teacher,
                students: classData.students,
              },
            },
          });
        });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
});

router.patch("/:classId/addStudent/:studentId", checkAuth, (req, res, next) => {
  const classId = req.params.classId;
  const studentId = req.params.studentId;

  Class.findById(classId)
    .exec()
    .then((classData) => {
      if (!classData) {
        return res.status(404).json({
          message: "Class not found",
        });
      }

      if (classData.teacher.toString() !== req.userData.userId) {
        return res.status(403).json({
          message: "You are not authorized to add students to this class",
        });
      }

      return Class.findByIdAndUpdate(
        classId,
        { $addToSet: { students: studentId } },
        { new: true }
      ).exec();
    })
    .then((result) => {
      if (result) {
        res.status(200).json({
          message: "Student added successfully",
          class: result,
          request: {
            type: "GET",
            url: "http://localhost:3000/classes/" + classId,
          },
        });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
});

router.patch(
  "/:classId/deleteStudent/:studentId",
  checkAuth,
  (req, res, next) => {
    const classId = req.params.classId;
    const studentId = req.params.studentId;

    Class.findById(classId)
      .exec()
      .then((classData) => {
        if (!classData) {
          return res.status(404).json({
            message: "Class not found",
          });
        }

        if (classData.teacher.toString() !== req.userData.userId) {
          return res.status(403).json({
            message:
              "You are not authorized to remove students from this class",
          });
        }

        return Class.findByIdAndUpdate(
          classId,
          { $pull: { students: studentId } },
          { new: true }
        ).exec();
      })
      .then((result) => {
        if (result) {
          res.status(200).json({
            message: "Student removed successfully",
            class: result,
            request: {
              type: "GET",
              url: "http://localhost:3000/classes/" + classId,
            },
          });
        }
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({
          error: err,
        });
      });
  }
);

router.patch("/:classId/addStudents", checkAuth, (req, res, next) => {
  const classId = req.params.classId;
  const studentIds = req.body.students;

  Class.findById(classId)
    .exec()
    .then((classData) => {
      if (!classData) {
        return res.status(404).json({
          message: "Class not found",
        });
      }

      if (classData.teacher.toString() !== req.userData.userId) {
        return res.status(403).json({
          message: "You are not authorized to add students to this class",
        });
      }

      return Class.findByIdAndUpdate(
        classId,
        { $addToSet: { students: { $each: studentIds } } },
        { new: true }
      ).exec();
    })
    .then((result) => {
      if (result) {
        res.status(200).json({
          message: "Students added successfully",
          class: result,
          request: {
            type: "GET",
            url: "http://localhost:3000/classes/" + classId,
          },
        });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
});

router.patch("/:classId/deleteStudents", checkAuth, (req, res, next) => {
  const classId = req.params.classId;
  const studentIds = req.body.students;

  Class.findById(classId)
    .exec()
    .then((classData) => {
      if (!classData) {
        return res.status(404).json({
          message: "Class not found",
        });
      }

      if (classData.teacher.toString() !== req.userData.userId) {
        return res.status(403).json({
          message: "You are not authorized to remove students from this class",
        });
      }

      return Class.findByIdAndUpdate(
        classId,
        { $pull: { students: { $in: studentIds } } },
        { new: true }
      ).exec();
    })
    .then((result) => {
      if (result) {
        res.status(200).json({
          message: "Students removed successfully",
          class: result,
          request: {
            type: "GET",
            url: "http://localhost:3000/classes/" + classId,
          },
        });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
});

module.exports = router;
