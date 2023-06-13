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

// app.use(
//   cors({
//     credentials: "true",
//     origin: "http://localhost:5173",
//   })
// );

app.use(cors());

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
                _id: "$$product._id",
                title: "$$product.title",
                // image: { $arrayElemAt: ["$$product.image", 0] },
                posterUrl: "$$product.posterURL",
                price: "$$product.price",
                code: "$$product.productCode",
                discount: "$$product.discount",
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
    const categoryId = req.params.categoryId;

    const _categoryId = new mongoose.Types.ObjectId(categoryId);
    const categoriesWithProducts = await CategoryModel.aggregate([
      {
        $match: {
          _id: _categoryId,
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
        $addFields: {
          products: {
            $map: {
              input: "$Allproducts",
              as: "product",
              in: {
                _id: "$$product._id",
                title: "$$product.title",
                posterUrl: "$$product.posterURL",
                price: "$$product.price",
                code: "$$product.productCode",
                discount: "$$product.discount",
              },
            },
          },
        },
      },
      {
        $project: {
          name: 1,
          image: 1,
          products: 1,
        },
      },
    ]);

    // const products = await ProductModel.find(
    //   { category: _categoryId },
    //   { title: 1, posterURL: 1, price: 1, productCode: 1 }
    // ).populate("category", "name image");
    const categoryWithProducts =
      categoriesWithProducts.length > 0 ? categoriesWithProducts[0] : [];
    res.json(categoryWithProducts);
  } catch (error) {
    res.status(500).json(error.message);
  }
});

// Get all category
// app.get("/fetchCategory", authorization, async (req, res) => {
//post local storage value

app.post("/getMyBag", async (req, res) => {
  const products = req.body;
  const result = [];
  try {
    for (const product of products) {
      const { productId, quantity } = product;
      const foundProduct = await ProductModel.findOne(
        { _id: productId },
        { posterURL: 1, title: 1, price: 1, productCode: 1 }
      );

      if (foundProduct) {
        const productDetail = {
          posterURL: foundProduct.posterURL,
          title: foundProduct.title,
          price: foundProduct.price,
          productCode: foundProduct.productCode,
          quantity,
        };
        result.push(productDetail);
      }
    }

    res.json(result);
  } catch (error) {
    res.json(error);
    console.log(error);
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
        const token = jwt.sign(
          { userId: savedUser._id, email: savedUser.email },
          "mystery"
        );
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

app.post("/login", async (req, res) => {
  let { email, password } = req.body;
  email = email.trim();
  password = password.trim();

  if (email === "" || password === "") {
    res.json({
      status: "FAILED",
      message: "Empty credentials supplied",
    });
  } else {
    try {
      // Check if user exists
      const user = await SignupModel.findOne({ email });
      if (!user) {
        return res.json({
          status: "FAILED",
          message: "Invalid credentials entered!",
        });
      }

      // Compare passwords
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.json({
          status: "FAILED",
          message: "Invalid password entered!",
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id, email: user.email },
        "mystery"
      );
      res.cookie("access_token", token, {
        httpOnly: true,
        // secure: process.env.NODE_ENV === "production",
      });

      res.json({
        status: "200",
        message: "Signin successful",
        data: user,
      });
    } catch (err) {
      console.error(err);
      res.json({
        status: "FAILED",
        message: "An error occurred while signing in!",
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
