import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { ObjectId } from "mongodb";
const { MongoClient, ServerApiVersion } = require('mongodb');

dotenv.config();

const uri = process.env.MONGO_DB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

async function run() {

  const db = client.db(process.env.DB_NAME);

  const booksCollection = db.collection("books");
  const borrowCollection = db.collection("borrow")

  try {
    await client.connect();

    app.get("/books", async (req: Request, res: Response) => {
      const result = await booksCollection.find().toArray();
      res.send(result);
    })

    app.post("/books", async (req: Request, res: Response) => {
      const book = req.body;
      const result = await booksCollection.insertOne(book);
      res.send(result);
    })

    // single book

    app.get("/books/:id", async (req: Request, res: Response) => {
      const id = req.params.id as string;
      const result = await booksCollection.findOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    })

    // update book

    app.patch("/books/:id", async (req: Request, res: Response) => {
      const id = req.params.id as string;
      const updateBook = req.body;
      const result = await booksCollection.updateOne(
      { _id: new ObjectId(id) },
       {
         $set: updateBook,
      }
      );
      res.send(result)
      })
  
  // delete book
  
    app.delete("/books/:id", async (req: Request, res: Response) => {
    const id = req.params.id as string;
      const result = await booksCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    })

    // borrow

    app.post("/borrow", async (req: Request, res: Response) => {
      const borrowData = req.body;
      const result = await borrowCollection.insertOne(borrowData);
      res.send(result);
    })

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});