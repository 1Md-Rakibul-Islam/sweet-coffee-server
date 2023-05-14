const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const { query } = require('express');
require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const port = process.env.PORT || 5000;
const app = express();

// middleware
app.use(cors());
app.use(express.json());


// Mongodb database setup
const dbUri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.gksews0.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(dbUri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


// jwt verify

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).send('unauthorized access')
    }

    const token = authHeader.split(' ')[1];
    console.log(token);

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })
}


async function run() {

    try{
        // db all collections
        const usersCollection = client.db('kaffa').collection('users');
        const productsCollection = client.db('kaffa').collection('products');
        const productsCategoriesCollection = client.db('kaffa').collection('productsCategories');





        // all user data insert on databse
        app.post('/users', async(req, res) => {
            const user = req.body;
            // console.log(products);
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })

        app.post('/products', async(req, res) => {
            const products = req.body;
            // console.log(products);
            const result = await productsCollection.insertOne(products);
            res.send(result);
        })

        //delete a products api
        app.delete('/products/:_id', async(req, res) => {
            const id = req.params._id;
            // console.log(id);
            const filter = { _id: ObjectId(id) }
            const result = await productsCollection.deleteOne(filter);
            res.send(result);
        })

        app.get('/products/category/:_id', async(req, res) => {
            const category = req.params._id;
            // console.log(category);
            const result = await productsCollection.find({ categoryName: category }).toArray();
            res.send(result);
        })

        app.get('/products', async(req, res) => {
            try {
                const total = await productsCollection.countDocuments({});
                const category = req.query.category;
                const PAGE_SIZE = parseInt(req.query.limit || {});;
                const page = parseInt(req.query.page || "1");
                

                console.log(PAGE_SIZE, page, total);

                if (category) {
                    const categoryproducts = await productsCollection.find({ categoryName: category }).toArray();
                    console.log(categoryproducts);
                    res.send("categoryproducts", categoryproducts);
                } 
                if (page) {
                    const products = await productsCollection.find({}).limit(PAGE_SIZE).skip(PAGE_SIZE * page).toArray();
                    // console.log("Job with page", products);
                    // res.send(products);
                    res.status(200).json({
                        totalPages: Math.ceil(total / PAGE_SIZE),
                        products,
                        message: "Success",
                      });
                } 
                else {
                    const allproducts = await productsCollection.find({}).toArray();
                    res.send(allproducts);
                }
            } catch (error) {
                console.error(error);
                res.status(500).send('Internal server error');
            }
        });


        app.get('/products/details/:_id', async(req, res) => {
            const id = req.params._id;
            // console.log(id);
            const filter = { _id: ObjectId(id) }
            const result = await productsCollection.findOne(filter);
            res.send(result);
        })
        

        app.get('/productsCategories', async(req, res) => {
            const category = await productsCategoriesCollection.find({}).toArray();
            res.send(category);
        })
 



    }

    finally{

    }
    
}
run().catch(console.log())


app.get('/', async(req, res) => {
    res.send('Server server is running');
})

app.listen(port, () => {
    console.log(`Server runnin on: ${port}`);
})