const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ee44r.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const userCollection = client.db("appVenture").collection("users");
    const productsCollection = client.db("appVenture").collection("products");
    const contactUsCollection = client.db("appVenture").collection("contactUs");
    const commentsCollection = client.db("appVenture").collection("comments");

    //jwt related API

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    // middlewares

    const verifyToken = (req, res, next) => {
      console.log("Insider Verify Token", req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "unauthorized  access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "unauthorized access" });
        }
        req.decoded = decoded;
        next();
      });
    };

    // verifyAdmin
    const verifyAdmin = async (req, res, next) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);

      const isAdmin = user?.role === "admin";
      if (!isAdmin) {
        return res.status(403).send({ message: "Forbidden access" });
      }
      next();
    };

    app.get("/users", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.get(`/users/admin/:email`, async (req, res) => {
      const email = req.params.email;
      if (email != req.email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === "admin";
      }
      res.send({ admin });
    });

    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email });
      res.send(user);
    });

    app.patch("/users/:email", async (req, res) => {
      const email = req.params.email;
      const updatedInfo = req.body;
      const result = await userCollection.updateOne(
        { email },
        { $set: updatedInfo }
      );
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);

      if (existingUser) {
        return res.send({ message: "User already Exists", insertedId: null });
      }

      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });

    app.patch(
      "/users/admin/:id",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            role: "admin",
          },
        };
        const result = await userCollection.updateOne(filter, updateDoc);
        res.send(result);
      }
    );

    //Products

    app.get("/products", async (req, res) => {
      const result = await productsCollection.find().toArray();
      res.send(result);
    });

    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productsCollection.findOne(query);
      res.send(result);
    });

    app.post("/products", async (req, res) => {
      const product = req.body;
      const result = await productsCollection.insertOne(product);
      res.send(result);
    });

    // Get products by a specific user
    app.get("/products/user/:email", async (req, res) => {
      const email = req.params.email;
      const products = await productsCollection
        .find({ "owner.email": email })
        .toArray();
      res.send(products);
    });

    // Delete a product
    app.delete("/products/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await productsCollection.deleteOne(query);

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

    // ✅ Update product information
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

        const result = await productsCollection.updateOne(filter, updateDoc);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Server error updating product" });
      }
    });

    // Update product status (Accept/Reject)
    app.patch("/products/:id/status", async (req, res) => {
      const id = req.params.id;
      const { status } = req.body;
      const result = await productsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status } }
      );
      res.send(result);
    });

    // Make product featured
    app.patch("/products/:id/featured", async (req, res) => {
      const id = req.params.id;
      const { featured } = req.body;
      const result = await productsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { featured } }
      );
      res.send(result);
    });

    // Voting route
    app.patch("/products/:id/vote", async (req, res) => {
      try {
        const id = req.params.id;
        const { userEmail } = req.body;

        const product = await productsCollection.findOne({
          _id: new ObjectId(id),
        });

        if (!product)
          return res
            .status(404)
            .send({ success: false, message: "Product not found" });

        // check if already voted
        if (product.votedUsers?.includes(userEmail)) {
          return res.send({ success: false, message: "You already voted" });
        }

        const result = await productsCollection.updateOne(
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

    // reviews route
    app.post("/products/:id/reviews", async (req, res) => {
      try {
        const id = req.params.id;
        const { rating, comment, user } = req.body;
        const review = { rating, comment, user, date: new Date() };

        const result = await productsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $push: { reviews: review } }
        );

        res.send({ success: true, result });
      } catch (error) {
        console.error(error);
        res.status(500).send({ success: false, message: "Server error" });
      }
    });

    // contactUs
    app.post("/contactUs", async (req, res) => {
      const user = req.body;
      const result = await contactUsCollection.insertOne(user);
      res.send(result);
    });

    // comments
    app.post("/comments", async (req, res) => {
      const user = req.body;
      const result = await commentsCollection.insertOne(user);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);

// Base route
app.get("/", (req, res) => {
  res.send("AppVenture Server is Running....");
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
