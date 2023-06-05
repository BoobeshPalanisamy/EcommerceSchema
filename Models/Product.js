const mongoose = require('mongoose')

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
    createddate: { type: Date, default: Date.now },
    discount: Number,
    description: Number,
    productcode: String,
    netweight: Number,
    materialtype: String,
    gender: {
        type: String,
        default: 'female'
    }

})

const ProductModel = mongoose.model("product", productSchema);

module.exports = ProductModel;