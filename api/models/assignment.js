const mongoose = require("mongoose");

const assignmentSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    class: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true},
    teacher : { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true }
}) 

module.exports = mongoose.model("Assignment", assignmentSchema);