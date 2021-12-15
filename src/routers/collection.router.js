const express = require("express");
const Image = require("../models/image.model");
const Collection = require("../models/collection.model");
const auth = require("../middleware/auth");
const sizeOf = require("image-size");
const router = new express.Router();
const fs = require("fs");

router.post("/collection", auth, async (req, res) => {
  const collection = new Collection({
    ...req.body,
    owner: req.user._id,
  });
  try {
    await collection.save();
    res.status(201).send(collection);
  } catch (e) {
    res.status(400).send(e);
  }
});

//get collection files formated for csv
router.get("/collection/:collectionId", auth, async (req, res) => {
  const id = req.params.collectionId;

  try {
    const images = await Image.find({ group: id }).populate("group"); //find images from collection
    const newImages = [];
    for (let i = 0; i < images.length; i++) {
      let tags = [];
      if (images[i].tags.length != 0) {
        tags = images[i].tags.map(function (image) {
          return image["tag"];
        });
      }
      let object = {
        path: images[i].imageName,
        tags: tags,
      };
      newImages.push(object);
    }

    res.json(newImages); //send all the images from this collection
  } catch (err) {
    res.status(500).send();
  }
});

//get collection files with id
router.get("/collection/id/:collectionId", auth, async (req, res) => {
  const id = req.params.collectionId;

  try {
    const images = await Image.find({ group: id }).populate("group"); //find images from collection
    const newImages = [];
    for (let i = 0; i < images.length; i++) {
      let dimensions = sizeOf(`imageFiles/${images[i].imageName}`);
      let tags = [];
      if (images[i].tags.length != 0) {
        tags = images[i].tags.map(function (image) {
          return image["tag"];
        });
      }
      let object = {
        _id: images[i]._id,
        path: images[i].imageName,
        tags: tags,
        width: dimensions.width,
        height: dimensions.height,
      };
      newImages.push(object);
    }

    res.json(newImages); //send all the images from this collection
  } catch (err) {
    res.status(500).send();
  }
});

//get collection info
router.get("/collection/info/:collectionId", auth, async (req, res) => {
  const id = req.params.collectionId;

  try {
    const collection = await Collection.findOne({ _id: id });

    if (!collection) {
      return res.status(404).send();
    }

    res.send(collection);
  } catch (err) {
    res.status(500).send();
  }
});

router.delete("/collection/:collectionId", auth, async (req, res) => {
  const _id = req.params.collectionId;

  try {
    const images = await Image.find({ group: _id }).populate("group"); //find images from collection
    for (let i = 0; i < images.length; i++) {
      path = images[i].path;
      // delete file named 'sample.txt'
      fs.unlinkSync(`./${path}`, function (err) {
        if (err) throw err;
        // if no error, file has been deleted successfully
        console.log("File deleted.");
      });
    }
    const collection = await Collection.deleteOne({ _id: _id });
    if (!collection) {
      return res.status(404).send();
    }
    res.send(collection);
  } catch (e) {
    res.status(400).send(e);
  }
});

//Update colelction
router.patch("/collection/:collectionId", auth, async (req, res) => {
  const _id = req.params.collectionId;
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "tags"];
  const isValidOperation = updates.every((update) => {
    return allowedUpdates.includes(update);
  });

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid update" });
  }

  try {
    const collection = await Collection.findOne({
      _id: _id,
      owner: req.user._id,
    });

    if (!collection) {
      return res.status(404).send();
    }

    updates.forEach((update) => {
      collection[update] = req.body[update];
    });
    await collection.save();

    res.send(collection);
  } catch (e) {
    res.status(400).send(e);
  }
});

//get list of collections
router.get("/collection", auth, async (req, res) => {
  const match = {};
  const sort = {};

  if (req.query.completed) {
    match.completed = req.query.completed === "true";
  }

  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(":");
    sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
  }

  try {
    await req.user
      .populate({
        path: "collections",
        match: match,
        options: {
          limit: parseInt(req.query.limit),
          skip: parseInt(req.query.skip),
          sort: sort,
        },
      })
      .execPopulate();
    const collections = req.user.collections;
    const newCollections = [];
    for (let i = 0; i < collections.length; i++) {
      let object = {
        _id: collections[i]._id,
        name: collections[i].name,
        tags: collections[i].tags,
      };
      newCollections.push(object);
    }

    res.send(newCollections);
  } catch (e) {
    res.status(500).send();
  }
});

module.exports = router;
