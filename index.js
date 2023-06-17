const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const SSLCommerzPayment = require("sslcommerz-lts");



// middleware
app.use(cors());
app.use(express.json());

const store_id = process.env.STORE_ID;
const store_passwd = process.env.STORE_PASS;
const is_live = false;

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
   // await client.connect();

    const classCollection = client
      .db("language-safari-db")
      .collection("classes");
    const userCollection = client.db("language-safari-db").collection("users");
    const instructorCollection = client
      .db("language-safari-db")
      .collection("instructors");
    const cartCollection = client.db("language-safari-db").collection("carts");

    // cart
    app.get("/carts", async (req, res) => {
      const email = req.query.email;

      if (!email) {
        res.send([]);
      }
      const query = { email: email };
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/carts", async (req, res) => {
      const newItem = req.body;

      const result = await cartCollection.insertOne(newItem);
      res.send(result);
    });

    app.delete("/carts/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    });

    // users crud operation
    app.get('/users', async(req,res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    })

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

    app.patch('/users/role/:id', async(req, res) => {
      const id = req.params.id;
      let result;
      const filter = { _id: new ObjectId(id)};
      const user = await userCollection.findOne(filter);
      if(user.role==='instructor'){
        const updateDoc = {
          $set: {
            role: 'admin'
          },
        };
  
         result = await userCollection.updateOne(filter, updateDoc);
      }
      else{
        const updateDoc = {
          $set: {
            role: 'instructor'
          },
        };
  
         result = await userCollection.updateOne(filter, updateDoc);
      }
      
      res.send(result);
    })
    
    app.get('/users/role/:email', async(req, res)=>{
      const email = req.params.email;
      console.log(email);
      const query = {email: email}
      const user = await userCollection.findOne(query);
      const result = {
        role: user?.role
      }
      res.send(result);

    })
    // instructors crud operation
    app.get("/instructors", async (req, res) => {
      let result;
      if (req.query?.search) {
        result = await instructorCollection
          .find()
          .sort({ student: 1 })
          .limit(6)
          .toArray();
      } else {
        result = await instructorCollection.find().toArray();
      }
      res.send(result);
    });

    // classes crud operation
    app.get("/classes", async (req, res) => {
      let result;
      if (req.query?.search) {
        result = await classCollection
          .find()
          .sort({ student: 1 })
          .limit(6)
          .toArray();
      } else {
        result = await classCollection.find().toArray();
      }
      res.send(result);
    });

    app.post("/classes", async (req, res) => {
      const newClass = req.body;
     
      const result = await classCollection.insertOne(newClass);
      res.send(result);
    });

    // order
    const tran_id = new ObjectId().toString();
    app.post("/order", async (req, res) => {
      const order = req.body;
      console.log(order);
      const data = {
        total_amount: order.amount,
        currency: "BDT",
        tran_id: tran_id, // use unique tran_id for each api call
        success_url: "http://localhost:3030/success",
        fail_url: "http://localhost:3030/fail",
        cancel_url: "http://localhost:3030/cancel",
        ipn_url: "http://localhost:3030/ipn",
        shipping_method: "Courier",
        product_name: "Computer.",
        product_category: "Electronic",
        product_profile: "general",
        cus_name: order.name,
        cus_email: order.email,
        cus_add1: "Dhaka",
        cus_add2: "Dhaka",
        cus_city: "Dhaka",
        cus_state: "Dhaka",
        cus_postcode: "1000",
        cus_country: "Bangladesh",
        cus_phone: "01711111111",
        cus_fax: "01711111111",
        ship_name: "Customer Name",
        ship_add1: "Dhaka",
        ship_add2: "Dhaka",
        ship_city: "Dhaka",
        ship_state: "Dhaka",
        ship_postcode: 1000,
        ship_country: "Bangladesh",
      };
      const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
      sslcz.init(data).then((apiResponse) => {
        // Redirect the user to payment gateway
        let GatewayPageURL = apiResponse.GatewayPageURL;
        res.send({url:GatewayPageURL});
        console.log("Redirecting to: ", GatewayPageURL);
      });
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
