const mongoose = require("mongoose");

const classSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  subject: {
    type: String,
    required: true,
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
    required: true,
  },
  students: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
  ],
});

module.exports = mongoose.model("Class", classSchema);
