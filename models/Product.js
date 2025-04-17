const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  category: String,
  stock: Number,
  images: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Media',
  },
  ratings: Number,
  createdAt: Date,
});

module.exports = mongoose.model('Product', productSchema);
