const express = require("express");
const Image = require("../models/image.model");
const Collection = require("../models/collection.model");
const auth = require("../middleware/auth");
const router = new express.Router();
const multer = require("multer");
const sizeOf = require("image-size");
const JSZip = require("jszip");
const fs = require("fs");

// Multer Setup -------------------------------------//
const storage = multer.diskStorage({
  // Store files in the API directory
  destination: function (req, file, callback) {
    callback(null, "./imageFiles");
  },
  // Name files the current time + the original filename
  filename: function (req, file, callback) {
    callback(null, Date.now() + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fieldSize: 3 * 1024 * 1024,
  },
});

//IMAGES -------------------------------------------//
// An array of files is passed into the funciton which contains 1 or more files
// to be processed. Sores the image name, description, category, and owner in the
// database
router.post(
  "/images/:collectionId",
  auth,
  upload.array("inpFile"),
  async (req, res) => {
    const id = req.params.collectionId;
    let files = req.files;
    let images = [];
    try {
      let index = 1; // index 0 will always be an empty string
      files.forEach(async (file) => {
        let image = new Image({
          imageName: file.filename,
          path: `./imageFiles/${file.filename}`,
          owner: req.user._id,
          group: id,
        });
        images.push(image);
        index++;
        await image.save();
      });
      res.status(201).send(images);
    } catch (e) {
      res.status(400).send(e);
    }
  }
);

router.get("/images/:id", auth, async (req, res) => {
  const _id = req.params.id;
  try {
    const image = await Image.findOne({ _id: _id });
    if (!image) {
      return res.status(404).send();
    }
    //console.log(image.tags[0].tag) acceder a una etiqueta
    res.send(image);
  } catch (e) {
    res.status(500).send();
  }
});

// Get/Download multiple images -------------------------------------//
router.get("/download/:collectionId", async (req, res) => {
  const _id = req.params.collectionId;
  const collectionInfo = await Collection.findOne({ _id: _id });
  const collectionImg = await Image.find({ group: _id }).populate("group"); //find images from collection
  const zip = new JSZip();
  var urls = [];

  for (let i = 0; i < collectionImg.length; i++) {
    urls[i] = `${collectionImg[i].path}`;
  }
  // Make a new text file README
  zip.file("README.txt", "Thank you for using FIAT!");

  // Make a new folder to store documents
  let images = zip.folder("");
  for (const document of urls) {
    images.file(
      document.replace(/.*\//g, ""),
      fs.readFileSync(document, { base64: true })
    );
  }
  // Convert the zip file into a buffer
  const content = await zip.generateAsync({ type: "nodebuffer" });
  // Save the zip file
  const zipName  = `${collectionInfo.name}-files.zip`
  fs.writeFileSync(zipName, content);
  // Sends new zipped file to the client for download
  const zippedFile = `${collectionInfo.name}-files.zip`;
  const pathForZip = "./";
  var options = {
    root: pathForZip,
  };

  res.sendFile(zipName, options, function (err) {
    if (err) {
      res.status(404).send(err);
    } else {
      console.log("Sent:", zippedFile);
    }
  });
});

//Add tag
router.patch("/images/:id", auth, async (req, res) => {
  const _id = req.params.id;
  const updates = Object.keys(req.body);
  const allowedUpdates = ["tags"];
  const isValidOperation = updates.every((update) => {
    return allowedUpdates.includes(update);
  });

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid update" });
  }

  try {
    let tagAlreadyExist = false;
    const image = await Image.findOne({ _id: _id });
    // console.log(image)
    if (!image) {
      return res.status(404).send();
    }

    for (let i = 0; i < image.tags.length; i++) {
      if (image.tags[i].tag == req.body.tags.tag) {
        tagAlreadyExist = true;
        console.log("Tag already exists!");
      }
    }
    if (!tagAlreadyExist) {
      image.tags.push(req.body.tags);
    }
    await image.save();
    res.send(image);
  } catch (e) {
    res.status(400).send(e);
  }
});

//Remove last tag
router.patch("/images/delete/:id", auth, async (req, res) => {
  const _id = req.params.id;
  const updates = Object.keys(req.body);
  const allowedUpdates = ["tags"];
  const isValidOperation = updates.every((update) => {
    return allowedUpdates.includes(update);
  });

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid update" });
  }

  try {
    const image = await Image.findOne({ _id: _id });
    console.log(image);
    if (!image) {
      return res.status(404).send();
    }

    image.tags.pop();
    await image.save();

    res.send(image);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.delete("/images/:id", auth, async (req, res) => {
  const _id = req.params.id;

  try {
    const image = await Image.findOneAndDelete({ _id: _id });

    if (!image) {
      return res.status(404).send();
    }

    res.send(image);
  } catch (e) {
    res.status(400).send(e);
  }
});

// Deletes multiple images
router.delete("/images/mult/:ids", auth, async (req, res) => {
  var ids = req.params.ids;
  var selectedRecords = ids.split(",");

  // TEST LINES - REMOVE AFTER WORKING
  /*
    console.log('ARRAY LENGTH: ' + selectedRecords.length)
    console.log('IDS IN API: ' + selectedRecords);
    console.log('RECORD 1: ' + selectedRecords[0]);
    console.log('RECORD 2: ' + selectedRecords[1]);
    console.log('RECORD 3: ' + selectedRecords[2]);
    console.log('RECORD 4: ' + selectedRecords[3]);
    console.log('RECORD 5: ' + selectedRecords[4]);
    */

  for (var i = 0; i < selectedRecords.length; i++) {
    try {
      const record = await Record.deleteMany({
        _id: selectedRecords[i],
        owner: req.user._id,
      });
    } catch (e) {
      res.status(400).send(e);
    }
  }
});

module.exports = router;
