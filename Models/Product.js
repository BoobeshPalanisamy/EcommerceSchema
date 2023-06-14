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
    },
  ],
  price: Number,
  color: [
    {
      type: String,
    },
  ],
  count: Number,
  // createdDate: { type: Date, default: Date.now },
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
