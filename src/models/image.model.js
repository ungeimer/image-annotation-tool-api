const mongoose = require('mongoose')

const imageSchema = new mongoose.Schema({
  imageName:{
    type: String,
    required: true
  },
    tags: [
        {
          tag: {
            type: String,
            required: false,
            _id : false 
          }
        },
      ],
    path: {
        type: String,
        required: true,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Collection'
  }
}, {
    timestamps: true
});

const imageModel = mongoose.model('Image', imageSchema)


module.exports = imageModel