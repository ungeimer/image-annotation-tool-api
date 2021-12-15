const mongoose = require("mongoose");

const collectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    tags: Array
  },
  {
    timestamps: true,
  }
);

collectionSchema.virtual("images", {
  ref: "Image",
  localField: "_id",
  foreignField: "group",
});

//Delete images when collection is removed
collectionSchema.pre("deleteOne", async function (next) {
  const collection = this.getQuery()["_id"];

  await mongoose.model("Image").deleteMany({'group': collection },function (err, result) {
    if (err) {
      console.log(`[error] ${err}`);
      next(err);
    } else {
      console.log('success');
      next();
    }
  });
});

const collectionModel = mongoose.model("Collection", collectionSchema);

module.exports = collectionModel;
