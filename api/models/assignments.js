const mongoose = require("mongoose");

const assignmentSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  title: {
    type: String,
    required: true,
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: true,
  },
  questionPaper: {
    type: String,
    required: true,
  },
  dueDate: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Assignment", assignmentSchema);
