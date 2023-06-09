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
const ProductOrderModel = require("./Models/Productorder");
const papa = require("papaparse");
const fs = require("fs");
const UserModel = require("./Models/User");

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

// This API is for product Bulk Upload

app.post("/bulkupload", async (req, res) => {
  try {
    const products = req.body;
    // console.log(products);

    // Create an array to store the created products
    const createdProducts = [];

    // Iterate over the products array and create a document for each product
    for (const productData of products) {
      // Find the category by name and replace it with the _id
      const category = await CategoryModel.findOne({
        name: productData.category,
      });
      if (category) {
        productData.category = category._id;
      }

      const createdProduct = await ProductModel.create(productData);
      createdProducts.push(createdProduct);
    }

    res.json(createdProducts);
  } catch (error) {
    console.error("Error creating products:", error);
    res.status(500).json({ error: "Error creating products" });
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

app.post("/getMyBag", async (req, res) => {
  const products = req.body;
  const result = [];
  let itemsPrice = 0; // Variable to store the total count for all products

  try {
    if (products && products.length > 0) {
      for (const product of products) {
        const { productId, sizes } = product;

        const foundProduct = await ProductModel.findOne(
          { _id: productId },
          { posterURL: 1, title: 1, price: 1, productCode: 1, sizes: 1 }
        );

        if (foundProduct) {
          const productDetail = {
            _id: foundProduct._id,
            posterURL: foundProduct.posterURL,
            title: foundProduct.title,
            productCode: foundProduct.productCode,
            sizes: [],
          };

          sizes.sort((a, b) => b.size.localeCompare(a.size));

          let productTotalCount = 0; // Variable to store the total count for each product

          for (const size of sizes) {
            if (size.qty > 0) {
              const foundSize = foundProduct.sizes.find(
                (sizeObj) => sizeObj.size === size.size
              );
              if (foundSize) {
                const sizePrizeTotal =
                  Number(foundSize.Price) * Number(size.qty);

                productDetail.sizes.push({
                  size: foundSize.size,
                  price: foundSize.Price,
                  qty: size.qty,
                });

                productTotalCount += sizePrizeTotal; // Increment productTotalCount with the totalCount of each size
              }
            }
          }

          itemsPrice += productTotalCount; // Increment totalProductCount with the productTotalCount

          if (productDetail.sizes.length !== 0) {
            result.push({
              ...productDetail,
            });
          }
        }
      }

      res.json({
        result: result,
        itemsPrice: itemsPrice,
        itemsCount: result.length,
      });
    } else {
      res.json({
        result: [],
        itemsPrice: 0,
        itemsCount: 0,
      });
    }
  } catch (error) {
    res.json(error);
    console.log(error);
  }
});

//get checkOut

app.post("/checkOut", async (req, res) => {
  const products = req.body;
  let itemsPrice = 0; // Variable to store the total count for all products

  try {
    if (products && products.length > 0) {
      for (const product of products) {
        const { productId, sizes } = product;

        const foundProduct = await ProductModel.findOne({ _id: productId });

        if (foundProduct) {
          let productTotalCount = 0;

          for (const size of sizes) {
            if (size.qty > 0) {
              const foundSize = foundProduct.sizes.find(
                (sizeObj) => sizeObj.size === size.size
              );
              if (foundSize) {
                const totalCount = Number(foundSize.Price) * Number(size.qty);

                productTotalCount += totalCount;
              }
            }
          }

          itemsPrice += productTotalCount;
        }
      }

      const deliveryFee = 0;
      const orderTotal = itemsPrice + deliveryFee;

      res.json({
        itemsPrice: itemsPrice,
        deliveryFee: deliveryFee,
        orderTotal: orderTotal,
      });
    } else {
      res.json({
        itemsPrice: 0,
        deliveryFee: 0,
        orderTotal: 0,
      });
    }
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

// Get Size and Instock by ID
app.get("/getSizesById/:productId", async (req, res) => {
  const { productId } = req.params;

  try {
    const product = await ProductModel.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const { sizes } = product;
    const filteredSizes = sizes.filter((item) => item.Instock > 0);
    res.json({ sizes: filteredSizes });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// RegisterAddress
app.post("/registeraddress", async (req, res) => {
  try {
    const newSignup = new SignupModel({
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
  let { name, phonenumber, email, password } = req.body;

  try {
    // Check if the user already exists
    const existingUser = await UserModel.findOne({ phonenumber });
    if (existingUser) {
      res.json({
        status: "FAILED",
        message: "User with provided email already exists",
      });
    } else {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const newUser = new UserModel({
        name,
        phonenumber,
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
});

// Login

app.post("/login", async (req, res) => {
  let { phonenumber, password } = req.body;
  phonenumber = phonenumber;
  password = password;

  if (phonenumber === "" || password === "") {
    res.json({
      status: "FAILED",
      message: "Empty credentials supplied",
    });
  } else {
    try {
      // Check if user exists
      const user = await UserModel.findOne({ phonenumber });
      if (!user) {
        return res.json({
          status: "FAILED",
          message: "User Not Available Please Signup to continue",
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
        { userId: user._id, PhoneNumber: user.PhoneNumber },
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

// Protected
app.get("/protected", authorization, (req, res) => {
  return res.json({ user: { id: req.id, email: req.email } });
});

// Reset Password
app.post("/forgotpassword", async (req, res) => {
  try {
    // Get the phone number from the request body
    const phonenumber = req.body.phonenumber;

    // Check if the user with the provided phone number exists
    const existingUser = await UserModel.findOne({ phonenumber });
    if (!existingUser) {
      return res.json({
        status: "FAILED",
        message: "User with provided phone number does not exist",
      });
    }

    // Generate a unique password reset token
    const resetToken = await generateResetToken();

    // Hash the reset token using bcrypt
    const hashedToken = await bcrypt.hash(resetToken, 10);

    // Store the hashed reset token and its associated phone number in your database or cache
    existingUser.resetToken = hashedToken;
    await existingUser.save();

    // Construct the custom reset link with the phone number included
    const resetLink = `/reset-password?phonenumber=${encodeURIComponent(
      phonenumber
    )}&token=${encodeURIComponent(resetToken)}`;

    // Return the reset link to the client
    res.json({ resetLink });
  } catch (error) {
    console.error("Error generating reset link:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const { randomBytes } = require("crypto");

function generateResetToken() {
  return new Promise((resolve, reject) => {
    randomBytes(16, (error, buffer) => {
      if (error) {
        reject(error);
      } else {
        resolve(buffer.toString("hex"));
      }
    });
  });
}

app.post("/reset-password", async (req, res) => {
  try {
    // Get the phone number and reset token from the request query parameters
    const phonenumber = req.query.phonenumber;
    const resetToken = req.query.token;

    // Find the user with the provided phone number
    const user = await UserModel.findOne({ phonenumber });
    if (!user) {
      return res.json({
        status: "FAILED",
        message: "User with provided phone number does not exist",
      });
    }

    if (user.isResetLinkUsed) {
      return res.json({
        status: "FAILED",
        message: "Reset link has already been used",
      });
    }

    // Hash the new password
    const newPassword = req.body.newPassword;
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password and reset token in the UserModel
    user.password = hashedPassword;
    user.resetToken = null;
    user.isResetLinkUsed = true;

    // Save the updated user in the database
    await user.save();

    res.json({
      status: "SUCCESS",
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//check validation

app.post("/checkValidation", async (req, res) => {
  const products = req.body;
  const errors = [];

  try {
    for (const product of products) {
      const { productId, sizes } = product;
      const foundProduct = await ProductModel.findOne({ _id: productId });

      var error = "";

      if (foundProduct) {
        for (const sizeObj of sizes) {
          var dbSize = foundProduct.sizes.find(
            (size) => size.size == sizeObj.size
          );

          if (dbSize.Instock == 0) {
            error =
              "Currently no stock for this product, remove this to proceed";
          }

          if (dbSize.Instock < sizeObj.Instock) {
            error = `Quantity you have selected is should be equal or less than the Instock count - ${dbSize.Instock}`;
          }

          if (dbSize.Instock != 0 && dbSize.Instock >= sizeObj.Instock) {
            continue;
          }

          var errorObject = {
            productId,
            sizeObj,
            error,
          };

          errors.push(errorObject);
        }
      }
    }
    res.json(errors);
  } catch (error) {
    res.json(error);
    console.log(error);
  }
});

// This API is for create Product Order Table
app.post("/productorder", async (req, res) => {
  try {
    var productorderDoc = await ProductOrderModel.create({
      ...req.body,
    });

    // Reduce the Instock quantity in the ProductModel for each ordered size
    for (const productDetail of req.body.productdetail) {
      for (const size of productDetail.sizes) {
        await ProductModel.updateOne(
          { _id: productDetail.productId, "sizes.size": size.size },
          { $inc: { "sizes.$.Instock": -size.quantity } }
        );
      }
    }

    res.json(productorderDoc);
  } catch (error) {
    res.json(error.message);
  }
});

// Get Orderdetails
app.get("/getOrderDetails", async (req, res) => {
  const searchOrder = req.query.id;
  try {
    let data = await ProductOrderModel.aggregate([
      {
        $match: { userId: { $regex: searchOrder } },
      },
      {
        $project: {
          _id: 1,
          productdetail: {
            $map: {
              input: "$productdetail",
              as: "product",
              in: {
                productId: "$$product.productId",
                title: "$$product.title",
                productcode: "$$product.productCode",
                posterURL: "$$product.posterURL",
                sizes: {
                  $map: {
                    input: "$$product.sizes",
                    as: "size",
                    in: {
                      size: "$$size.size",
                      qty: "$$size.quantity",
                      price: "$$size.price",
                    },
                  },
                },
              },
            },
          },
          totalprice: 1,
          status: 1,
          orderdateandtime: 1,
          showposter: { $arrayElemAt: ["$productdetail.posterURL", 0] },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%d-%m-%Y", date: "$orderdateandtime" },
          },
          orders: { $push: "$$ROOT" },
        },
      },
      { $sort: { _id: -1 } },
    ]);
    res.send(data);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred");
  }
});

// This api is for search

app.get("/searchproduct", async (req, res) => {
  const searchTerm = req.query.searchTerm;
  let data = await ProductModel.aggregate([
    {
      $match: {
        $or: [
          { title: { $regex: searchTerm, $options: "i" } },
          { productCode: { $regex: searchTerm, $options: "i" } },
        ],
      },
    },
    {
      $project: {
        title: 1,
        _id: 1,
        sizes: {
          $map: {
            input: "$sizes",
            as: "size",
            in: "$$size.size",
          },
        },
        posterURL: 1,
        productCode: 1,
        discount: 1,
        price: { $arrayElemAt: ["$sizes.Price", 0] },
      },
    },
  ]);
  res.send(data);
});

// This API is for CSV upload

app.get("/uploadcsv", async (req, res) => {
  try {
    const papa = require("papaparse");
    const filePath = req.query.filePath;
    const file = await fs.promises.readFile(
      filePath,
      //  "C:/Users/Admin/Downloads/Product_Upload.csv",
      "utf8"
    );

    papa.parse(file, {
      skipEmptyLines: "greedy",
      header: false,
      complete: (result) => {
        // console.dir(result.data);
        res.send(result.data);
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
