const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ee44r.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let dbInitPromise;
const collections = {};

async function initDb() {
  if (dbInitPromise) {
    await dbInitPromise;
    return collections;
  }

  dbInitPromise = client.connect().then(() => {
    const db = client.db("appVenture");
    collections.userCollection = db.collection("users");
    collections.productsCollection = db.collection("products");
    collections.contactUsCollection = db.collection("contactUs");
    collections.commentsCollection = db.collection("comments");
    collections.reportedCollection = db.collection("reportedProducts");
  });

  await dbInitPromise;
  return collections;
}

app.use(async (req, res, next) => {
  try {
    await initDb();
    next();
  } catch (error) {
    next(error);
  }
});

app.get("/users", async (req, res) => {
  const { userCollection } = collections;
  const result = await userCollection.find().toArray();
  res.send(result);
});

app.get("/users/admin/:email", async (req, res) => {
  const email = req.params.email;

  if (!req.decoded) {
    return res.status(401).send({ message: "unauthorized access" });
  }

  if (email !== req.decoded.email) {
    return res.status(403).send({ message: "forbidden access" });
  }

  const query = { email };
  const user = await collections.userCollection.findOne(query);
  res.send({ admin: user?.role === "admin" });
});

app.get("/users/:email", async (req, res) => {
  const email = req.params.email;
  const user = await collections.userCollection.findOne({ email });
  res.send(user);
});

app.patch("/users/:email", async (req, res) => {
  const email = req.params.email;
  const result = await collections.userCollection.updateOne(
    { email },
    { $set: { role: "admin" } }
  );
  res.send(result);
});

app.post("/users", async (req, res) => {
  const user = req.body;
  const query = { email: user.email };
  const existingUser = await collections.userCollection.findOne(query);

  if (existingUser) {
    return res.send({ message: "User already Exists", insertedId: null });
  }

  const result = await collections.userCollection.insertOne(user);
  res.send(result);
});

app.delete("/users/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await collections.userCollection.deleteOne(query);
  res.send(result);
});

app.patch("/users/admin/:id", async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const updateDoc = {
    $set: {
      role: "admin",
    },
  };
  const result = await collections.userCollection.updateOne(filter, updateDoc);
  res.send(result);
});

app.get("/products", async (req, res) => {
  const result = await collections.productsCollection.find().toArray();
  res.send(result);
});

app.get("/products/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await collections.productsCollection.findOne(query);
  res.send(result);
});

app.post("/products", async (req, res) => {
  const product = req.body;
  const result = await collections.productsCollection.insertOne(product);
  res.send(result);
});

app.get("/reported-products", async (req, res) => {
  const result = await collections.reportedCollection.find().toArray();
  res.send(result);
});

app.get("/products/user/:email", async (req, res) => {
  const email = req.params.email;
  const products = await collections.productsCollection
    .find({ "owner.email": email })
    .toArray();
  res.send(products);
});

app.delete("/products/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await collections.productsCollection.deleteOne(query);

    if (result.deletedCount > 0) {
      res.send({ success: true, message: "Product deleted successfully" });
    } else {
      res.send({ success: false, message: "Product not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Server error deleting product" });
  }
});

app.patch("/products/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const updateData = req.body;
    const filter = { _id: new ObjectId(id) };

    const updateDoc = {
      $set: {
        name: updateData.name,
        tagline: updateData.tagline,
        description: updateData.description,
        image: updateData.image,
        category: updateData.category,
        tags: updateData.tags,
        website: updateData.website,
        github: updateData.github,
        pricing: updateData.pricing,
        timestamp: new Date(),
      },
    };

    const result = await collections.productsCollection.updateOne(filter, updateDoc);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Server error updating product" });
  }
});

app.patch("/products/:id/status", async (req, res) => {
  const id = req.params.id;
  const { status } = req.body;
  const result = await collections.productsCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { status } }
  );
  res.send(result);
});

app.patch("/products/:id/featured", async (req, res) => {
  const id = req.params.id;
  const { featured } = req.body;
  const result = await collections.productsCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { featured } }
  );
  res.send(result);
});

app.patch("/products/:id/vote", async (req, res) => {
  try {
    const id = req.params.id;
    const { userEmail } = req.body;

    const product = await collections.productsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!product) {
      return res.status(404).send({ success: false, message: "Product not found" });
    }

    if (product.votedUsers?.includes(userEmail)) {
      return res.send({ success: false, message: "You already voted" });
    }

    const result = await collections.productsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $inc: { votes: 1 },
        $push: { votedUsers: userEmail },
      }
    );

    res.send({ success: true, result });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: "Server error" });
  }
});

app.post("/products/:id/reviews", async (req, res) => {
  try {
    const id = req.params.id;
    const { rating, comment, user } = req.body;
    const review = { rating, comment, user, date: new Date() };

    const result = await collections.productsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $push: { reviews: review } }
    );

    res.send({ success: true, result });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: "Server error" });
  }
});

app.post("/contactUs", async (req, res) => {
  const user = req.body;
  const result = await collections.contactUsCollection.insertOne(user);
  res.send(result);
});

app.post("/comments", async (req, res) => {
  const user = req.body;
  const result = await collections.commentsCollection.insertOne(user);
  res.send(result);
});

app.get("/", (req, res) => {
  res.send("AppVenture Server is Running....");
});

module.exports = app;
