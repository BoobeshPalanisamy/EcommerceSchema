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
      ...req.body,
    });
    res.json(productDoc);
  } catch (error) {
    res.json(error.message);
  }
});

app.get("/getAllProductsByCategory", async (req, res) => {
  try {
    const getAllproductsDoc = await CategoryModel.aggregate([
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "category",
          as: "Allproducts",
        },
      },
      {
        $project: {
          Allproducts: {
            $map: {
              input: "$Allproducts",
              as: "product",
              in: {
                title: "$$product.title",
                posterUrl: "$$product.image",
                price: "$$product.price",
                color: "$$product.color",
                materialType: "$$product.materialType",
              },
            },
          },
        },
    }
    ]);

    res.json(getAllproductsDoc);
  } catch (error) {
    console.log(error.message);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
