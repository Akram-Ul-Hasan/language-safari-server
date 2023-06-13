const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");

// middleware
app.use(cors());
app.use(express.json());

// mongodb connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8bdsz2a.mongodb.net/?retryWrites=true&w=majority`;

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

    const classCollection = client
      .db("language-safari-db")
      .collection("classes");
    const userCollection = client.db("language-safari-db").collection("users");
    const instructorCollection = client
      .db("language-safari-db")
      .collection("instructors");
    const cartCollection = client.db("language-safari-db").collection("carts");

    // cart
    app.get("carts", async (req, res) => {
      const email = req.body.email;
      if (!email) {
        res.send([]);
      }
      const query = { email: email };
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/carts", async (req, res) => {
      const newCart = req.body;
      console.log(newCart);
      const result = await cartCollection.insertOne(newCart);
      res.send(result);
    });

    // users crud operation
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exists" });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // instructors crud operation
    app.get("/instructors", async (req, res) => {
      let result;
      if (req.query?.search) {
        result = await instructorCollection.find().sort({ student: 1 }).limit(6).toArray();
      } 
      else {
        result = await instructorCollection.find().toArray();
      }
      res.send(result);
    });

    // classes crud operation
    app.get("/classes", async (req, res) => {
      
      let result;
      if (req.query?.search) {
        result = await classCollection.find().sort({ student: 1 }).limit(6).toArray();
      } else {
        result = await classCollection.find().toArray();
      }

      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Language safari server is running");
});

app.listen(port, () => {
  console.log(`Language safari is running on port ${port}`);
});
