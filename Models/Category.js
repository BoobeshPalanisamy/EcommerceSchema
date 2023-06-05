const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema({
    name: String,
    image: [{
        type: String
    }],
    description: String
})

const CategoryModel = mongoose.model("category", categorySchema);

module.exports = CategoryModel;