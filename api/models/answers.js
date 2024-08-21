const mongoose = require("mongoose");

const answerSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Assignment",
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    require: true,
  },
  uploadDate: {
    type: String,
    required: true,
  },
  answerPaper: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Answer", answerSchema);
