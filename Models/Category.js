const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema({
    name: String,
    image: [{
        type: String
    }],
    description: String,
    productsId:[{
        type: mongoose.Types.ObjectId,
        ref: "product",
    }]
})

const CategoryModel = mongoose.model("category", categorySchema);

module.exports = CategoryModel;