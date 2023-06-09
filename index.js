const express = require("express");
const app = express();
const mongoose = require("mongoose");
var cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 3000;
const CategoryModel = require("./Models/category");
const ProductModel = require("./Models/Product");
const SignupModel = require('./Models/Validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
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
    credentials: "true",
    origin: "http://localhost:5173",
  })
);

app.use(express.json());
app.use(cookieParser());

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
app.get("/fetchCategory", async (req, res) => {
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


// Signup & Login using JWT(Json Web Token) authorization

const authorization = (req, res, next) => {
    const token = req.cookies.access_token;
    console.log(token)
    if (!token) {
        return res.sendStatus(403);
    }
    try {
        const data = jwt.verify(token, "mystery");
        req.id = data.userId
        req.email = data.email;
        return next();
    } catch {
        return res.sendStatus(403);
    }
};



// SignUp

app.post("/signup", async (req, res) => {
    let { name, email, password } = req.body;
    name = name.trim();
    email = email.trim();
    password = password.trim();

    if (name === "" || email === "" || password === "") {
        res.json({
            status: "FAILED",
            message: "Empty input fields!",
        });
    } else if (!/^[a-zA-Z\s]+$/.test(name)) {
        res.json({
            status: "FAILED",
            message: "Invalid name format",
        });
    } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
        res.json({
            status: "FAILED",
            message: "Invalid email format",
        });
    } else if (password.length < 8) {
        res.json({
            status: "FAILED",
            message: "Password is too short!",
        });
    } else {
        try {
            // Check if the user already exists
            const existingUser = await SignupModel.findOne({ email });
            if (existingUser) {
                res.json({
                    status: "FAILED",
                    message: "User with provided email already exists",
                });
            } else {
                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash(password, saltRounds);
                const newUser = new SignupModel({
                    name,
                    email,
                    password: hashedPassword,
                });
                const savedUser = await newUser.save();
                // Generate JWT token
                const token = jwt.sign({ userId: savedUser._id, email: savedUser.email }, 'mystery');
                res
                    .cookie("access_token", token, {
                        httpOnly: true,
                        secure: false,
                    })
                    .json({
                        status: "200",
                        message: "Signup Successful",
                        data: savedUser,
                    });
            }
        } catch (err) {
            console.error(err);
            res.json({
                status: "FAILED",
                message: "An error occurred while signing up!",
            });
        }
    }
});

// Signin 

app.post('/login', async (req, res) => {
    let { email, password } = req.body;
    email = email.trim();
    password = password.trim();

    if (email === "" || password === "") {
        res.json({
            status: "FAILED",
            message: "Empty credentials supplied"
        });
    } else {
        try {
            // Check if user exists
            const user = await SignupModel.findOne({ email });
            if (!user) {
                return res.json({
                    status: "FAILED",
                    message: "Invalid credentials entered!"
                });
            }

            // Compare passwords
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.json({
                    status: "FAILED",
                    message: "Invalid password entered!"
                });
            }

            // Generate JWT token
            const token = jwt.sign({ userId: user._id, email: user.email }, 'mystery');
            res.cookie("access_token", token, {
                httpOnly: true,
                // secure: process.env.NODE_ENV === "production",
            });

            res.json({
                status: "200",
                message: "Signin successful",
                data: user
            });
        } catch (err) {
            console.error(err);
            res.json({
                status: "FAILED",
                message: "An error occurred while signing in!"
            });
        }
    }
});


app.get("/protected", authorization, (req, res) => {
    return res.json({ user: { id: req.id, email: req.email } });
});




app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
