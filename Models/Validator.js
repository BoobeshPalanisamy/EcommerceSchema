const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const signupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
});

signupSchema.plugin(uniqueValidator);

const SignupModel = mongoose.model('Signup', signupSchema);

module.exports = SignupModel;
