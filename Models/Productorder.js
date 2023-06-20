const mongoose = require("mongoose");

const productorderSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  productdetail: [
    {
      productId: {
        type: String,
        required: true,
      },
      sizes: [
        {
          size: {
            type: String,
            required: true,
          },
          quantity: {
            type: Number,
            required: true,
          },
          price: {
            type: Number,
            required: true,
          },
        },
      ],
    },
  ],
  shippingdetail: {
    name: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    phonenumber: {
      type: Number,
      required: true,
    },
    alternativenumber: {
      type: Number,
      required: true,
    },
    pincode: {
      type: Number,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
  },
  orderdateandtime: {
    type: Date,
    default: Date.now,
    required: "Must have start date - default value is the created date",
  },
  totalprice: {
    type: Number,
    required: true,
  },
  paymentId: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
});

const ProductOrderModel = mongoose.model("Productorder", productorderSchema);

module.exports = ProductOrderModel;
