const express = require("express");
const app = express();
const mongoose = require("mongoose");
var cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 3000;
const ProductModel = require("./Models/Product");
const SignupModel = require("./Models/User");
const CategoryModel = require("./Models/CategoryTest");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

main().catch((err) => console.log(err));

async function main() {
  await mongoose.connect(process.env.MONGODB_CONNECTION);
}

mongoose.connection.on("connected", () => {
  console.log("Db Connected");
});

app.use(
  cors({
    credentials: true,
    origin: "http://localhost:5173",
  })
);

app.use(express.json());
app.use(cookieParser());

// Signup & Login using JWT(Json Web Token) authorization

const authorization = (req, res, next) => {
  const token = req.cookies.access_token;
  console.log(token);
  if (!token) {
    return res.sendStatus(403);
  }
  try {
    const data = jwt.verify(token, "mystery");
    req.id = data.userId;
    req.email = data.email;
    return next();
  } catch {
    return res.sendStatus(403);
  }
};

// This API is for Category
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

// This API is for Product for each category
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
    const productsByCategory = await CategoryModel.aggregate([
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "category",
          as: "Allproducts",
        },
      },
      {
        $addFields: {
          products: {
            $map: {
              input: { $slice: ["$Allproducts", 10] },
              as: "product",
              in: {
                title: "$$product.title",
                // image: { $arrayElemAt: ["$$product.image", 0] },
                price: "$$product.price",
                discount: "$$product.discount",
                posterUrl: "$$product.posterURL",
                materialType: "$$product.materialType",
              },
            },
          },
        },
      },
      {
        $project: {
          name: 1,
          products: 1,
        },
      },
    ]);

    res.json(productsByCategory);
  } catch (error) {
    console.log(error.message);
  }
});

app.get("/fetchProductsByCategory/:categoryId", async (req, res) => {
  try {
    const categoaryId = req.params.categoryId;
    const id = new mongoose.Types.ObjectId(categoaryId);
    const products = await ProductModel.aggregate([
      {
        $match: {
          _id: id,
        },
      },
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
      },
    ]);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Get all category
app.get("/fetchCategory", authorization, async (req, res) => {
  var course = await CategoryModel.find();
  res.json(course);
});

// Get products by category ID
app.get("/fetchProductsByCategory/:categoryId", async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const products = await ProductModel.find({ category: categoryId });

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Get product by ID
app.get("/fetchProductByID/:productId", async (req, res) => {
  try {
    const productId = req.params.productId;
    const product = await ProductModel.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// RegisterAddress
app.post("/registeraddress", async (req, res) => {
  try {
    // const {
    //   Name,
    //   PhoneNumber,
    //   AlternatePhone,
    //   Locality,
    //   Address,
    //   City,
    //   Pincode,
    //   State,
    //   Landmark,
    //   AddressType,
    // } = req.body;

    const newSignup = new SignupModel({
      // Name,
      // PhoneNumber,
      // AlternatePhone,
      // Locality,
      // Address,
      // City,
      // Pincode,
      // State,
      // Landmark,
      // AddressType,
      ...req.body,
    });

    await newSignup.save();

    res.status(201).json({ message: "Registration successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred during registration" });
  }
});

// Get user by ID for address
app.get("/user/:id", async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await SignupModel.findById(userId);
    if (user) {
      res.json({
        status: "SUCCESS",
        data: user,
      });
    } else {
      res.json({
        status: "FAILED",
        message: "User not found",
      });
    }
  } catch (err) {
    console.error(err);
    res.json({
      status: "FAILED",
      message: "An error occurred while fetching the user",
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
