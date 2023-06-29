const mongoose = require("mongoose");
const CategoryModel = require("./CategoryTest");

const productSchema = new mongoose.Schema({
  title: String,
  image: [
    {
      type: String,
    },
  ],
  sizes: [
    {
      size: String,
      Instock: Number,
      Price: Number,
    },
  ],
  color: String,
  // createdDate: { type: Date, default: Date.now },
  price: Number,
  discount: Number,
  description: String,
  productCode: String,
  netWeight: Number,
  materialType: String,
  posterURL: String,
  category: { type: mongoose.Schema.Types.ObjectId, ref: CategoryModel },
});

const ProductModel = mongoose.model("Product", productSchema);

module.exports = ProductModel;
