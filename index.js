const express = require('express');
const app = express();
var cors = require('cors');
const port = 3000;
const mongoose = require('mongoose');
const CategoryModel = require('./Models/category');

main().catch(err => console.log(err));

async function main() {
    await mongoose.connect(
        'mongodb+srv://pmboobesh:a5pIqiYiNwRwnGUB@cluster0.hbtw8lt.mongodb.net/Ecommerce');
};


app.use(cors({
    credentials: "true",
    origin: "http://localhost:5173"
}));

app.post("/category", async (req, res) => {
    try {
        var categoryDoc = await CategoryModel.create({
            ...req.body
        });
        res.json(categoryDoc);
    } catch (error) {
        res.json(error.message)
    }
})

app.use((express.json()))

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});


