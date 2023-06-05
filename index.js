const express = require("express");
const app = express();
const mongoose = require("mongoose");
var cors = require("cors");
require("dotenv").config();

const port = 3000;
const CategoryModel = require("./Models/category");

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
        var test = "kumutha dfgdsg"
        var categoryDoc = await CategoryModel.create({
            ...req.body,
        });
        var test = "sathya";
        res.json(categoryDoc);
    } catch (error) {
        res.json(error.message);
    }
});

app.post("/createProduct/:CategoryId", async (req, res) => {
    const CategoryId = req.params.CategoryId;
    try {
        var productDoc = await ProductModel.create({ ...req.body });

        if (productDoc != null) {
            await CategoryModel.findByIdAndUpdate(CategoryId, {
                $push: { productsId: productDoc._id },
            });
            res.json(productDoc);
        }
    } catch (error) {
        res.json(error.message);
    }
});

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
