const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const morgan = require("morgan");

const classesRoutes = require("./api/routes/classes");
const teachersRoutes = require("./api/routes/teachers");
const studentsRoutes = require("./api/routes/students");
const assignmentsRoutes = require("./api/routes/assignments");
const answersRoutes = require("./api/routes/answers");

mongoose.connect(
  "mongodb+srv://geedhavarshinii:" +
    process.env.MONGO_ATLAS_PWD +
    "@node-rest-assignment-up.r52k4.mongodb.net/?retryWrites=true&w=majority&appName=node-rest-assignment-upload"
);
mongoose.Promise = global.Promise;

app.use(morgan("dev"));
app.use("/uploads", express.static("uploads"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    return res.status(200).json({});
  }
  next();
});

app.use("/classes", classesRoutes);
app.use("/teachers", teachersRoutes);
app.use("/students", studentsRoutes);
app.use("/assignments", assignmentsRoutes);
app.use("/answers", answersRoutes);

app.use((req, res, next) => {
    const error = new Error("Not Found");
    error.status = 404;
    next(error);
})

app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message,
        }
    })
})

module.exports = app;