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

// async function run() {
//   try {
//     await client.connect();

client.connect(() => {
  console.log('connect to mongodb');
}).catch(console.dir)
    
    const db = client.db(process.env.DB_NAME);
    const booksCollection = db.collection("books");
    const borrowCollection = db.collection("borrow");

    app.get("/books", async (req: Request, res: Response) => {
      const search = req.query.search as string;
      const page = Number(req.query.page) || 1;
      const limit = 8;
      const skip = (page - 1) * limit;
      let query = {};

      if (search) {
        query = {
          title: {
            $regex: search,
            $options: 'i',
          }
        }
      }
      const total = await booksCollection.countDocuments(query)
      const result = await booksCollection.find(query).skip(skip).limit(limit).toArray();
      res.send({books: result, total});
    })

    app.post("/books", async (req: Request, res: Response) => {
      const book = req.body;
      book.totalCopies = Number(book.totalCopies);
      book.availableCopies = Number(book.availableCopies);
      const result = await booksCollection.insertOne(book);
      res.send({
        success: true,
        insertedId: result.insertedId,
      });
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

    // borrow book

    app.get("/borrow", async (req: Request, res: Response) => {
      const result = await borrowCollection.find().toArray();
      res.send(result);
    })

    app.post("/borrow", async (req: Request, res: Response) => {
      const borrowData = req.body;
      const { bookId } = borrowData;
      const book = await booksCollection.findOne({
        _id: new ObjectId(bookId),
      });

      if (book.availableCopies <= 0) {
        return res.send({
          message: "No Copies Available"
        });
      }
      await borrowCollection.insertOne(borrowData);
      await booksCollection.updateOne(
        {
          _id: new ObjectId(bookId),
        },
        {
          $set: {
            availableCopies: book.availableCopies - 1,
          },
        }
      )
      res.send({
        message: "Borrow Success",
      })
    })

    // manage-book

    // app.get("/manage-books", async (req: Request, res: Response) => {
    //   const result = await booksCollection.find().toArray();
    //   res.send(result);
    // })


    // await client.db("admin").command({ ping: 1 });
//     console.log("Pinged your deployment. You successfully connected to MongoDB!");
//   } finally {
//     // await client.close();
//   }
// }
// run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

module.exports = app;