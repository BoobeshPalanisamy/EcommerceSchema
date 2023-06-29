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
  isResetLinkUsed: String,
});

const UserModel = mongoose.model("User", userSchema);

module.exports = UserModel;
