const mongoose = require('mongoose');
const CategoryModel = require("./category");

const productSchema = new mongoose.Schema({
    title: String,
    image: [{
        type: String
    }],
    size: [{
        type: String
    }],
    price: Number,
    color: [{
        type: String
    }],
    count: Number,
    // createdDate: { type: Date, default: Date.now },
    discount: Number,
    description: String,
    productCode: String,
    netWeight: Number,
    materialType: String,
    gender: {
        type: String,
        default: 'female'
    },
    posterURL: String,
    category: { type: mongoose.Schema.Types.ObjectId, ref: CategoryModel },

});

const ProductModel = mongoose.model("Product", productSchema);

module.exports = ProductModel;
