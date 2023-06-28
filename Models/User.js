// const mongoose = require("mongoose");

// const signupSchema = new mongoose.Schema({
// //   PhoneNumber: {
// //     type: Number,
// //     required: true,
// //   },
//   ShippingDetails: [
//     {
//       Name: {
//         type: String,
//         required: true,
//       },
//       PhoneNumber: {
//         type: Number,
//         required: true,
//       },
//       AlternatePhone: {
//         type: Number,
//         required: true,
//       },
//       Locality: {
//         type: String,
//         required: true,
//       },
//       Address: {
//         type: String,
//         required: true,
//       },
//       City: {
//         type: String,
//         required: true,
//       },
//       Pincode: {
//         type: Number,
//         required: true,
//       },
//       State: {
//         type: String,
//         required: true,
//       },
//       Landmark: {
//         type: String,
//         required: true,
//       },
//       AddressType: {
//         type: String,
//         required: true,
//       },
//       main: {
//         type: Boolean,
//         default: false,
//       },
//     },
//   ],
// });

// const SignupModel = mongoose.model("Register", signupSchema);

// module.exports = SignupModel;

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  phonenumber: {
    type: Number,
    required: true,
  },
  email: String,
  password: {
    type: String,
    required: true,
  },
  isResetLinkUsed:String
});

const UserModel = mongoose.model("User", userSchema);

module.exports = UserModel;
