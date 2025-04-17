const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  category: String,
  stock: Number,
  images: [String],
  ratings: Number,
  createdAt: Date,
});

module.exports = mongoose.model('Product', productSchema);
