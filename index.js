const express = require("express");
const app = express();
const mongoose = require("mongoose");
var cors = require("cors");
require("dotenv").config();
const port = 3000;
const CategoryModel = require("./Models/category");
const ProductModel = require("./Models/Product");

main().catch((err) => console.log(err));

async function main() {
    await mongoose.connect(process.env.MONGODB_CONNECTION);
}

mongoose.connection.on("connected", () => {
    console.log("Db Connected");
});

app.use(
    cors({
        credentials: "true",
        origin: "http://localhost:5173",
    })
);

app.use(express.json());

app.post("/createCategory", async (req, res) => {
    try {
        var test = "praveen"
        var categoryDoc = await CategoryModel.create({
            ...req.body,
        });
        res.json(categoryDoc);
    } catch (error) {
        res.json(error.message);
    }
});


app.post("/createProduct", async (req, res) => {
    try {
        var productDoc = await ProductModel.create({
            ...req.body
        });
        res.json(productDoc);
    } catch (error) {
        res.json(error.message)
    }
});


app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
