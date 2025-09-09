<<<<<<< HEAD
const express = require('express')
const app = express()
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
=======
const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
>>>>>>> 402d9a7 (Initial commit)
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

<<<<<<< HEAD




const { MongoClient, ServerApiVersion } = require('mongodb');
=======
const { MongoClient, ServerApiVersion } = require("mongodb");
>>>>>>> 402d9a7 (Initial commit)
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ee44r.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
<<<<<<< HEAD
  }
=======
  },
>>>>>>> 402d9a7 (Initial commit)
});

async function run() {
  try {
<<<<<<< HEAD

    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();


    const userCollection = client.db('appVenture').collection('users');


    //jwt related API

    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      res.send({ token });
    })


    app.get('/users', async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    })

    app.post('/users', async (req, res) => {
=======
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const userCollection = client.db("appVenture").collection("users");
    const productsCollection = client.db("appVenture").collection("products");

    //jwt related API

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    app.get("/users", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.post("/users", async (req, res) => {
>>>>>>> 402d9a7 (Initial commit)
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);

      if (existingUser) {
<<<<<<< HEAD
        return res.send({ message: 'User already Exists', insertedId: null })
=======
        return res.send({ message: "User already Exists", insertedId: null });
>>>>>>> 402d9a7 (Initial commit)
      }

      const result = await userCollection.insertOne(user);
      res.send(result);
<<<<<<< HEAD
    })

    app.delete('/users/:id', async (req, res) => {
=======
    });

    app.delete("/users/:id", async (req, res) => {
>>>>>>> 402d9a7 (Initial commit)
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
<<<<<<< HEAD
    })

    

=======
    });

      //Products

    app.get("/products", async (req, res) => {
      const result = await productsCollection.find().toArray();
      res.send(result);
    });
>>>>>>> 402d9a7 (Initial commit)

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);

<<<<<<< HEAD

// Base route
app.get('/', (req, res) => {
  res.send('AppVenture Server is Running....');
=======
// Base route
app.get("/", (req, res) => {
  res.send("AppVenture Server is Running....");
>>>>>>> 402d9a7 (Initial commit)
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
