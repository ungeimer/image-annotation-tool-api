const express = require("express");
const cors = require("cors");

require("./db/mongoose");
const userRouter = require("./routers/user.router");
const imageRouter = require("./routers/image.router");
const collectionRouter = require("./routers/collection.router");

const app = express();

app.use(cors());
app.use(express.json());
app.use('/imageFiles', express.static('imageFiles'));
app.use(userRouter);
app.use(imageRouter);
app.use(collectionRouter);


module.exports = app;
