import { MongoClient } from "mongodb";
import { ServerApiVersion } from "mongodb";

const uri =
  "mongodb+srv://admin:korisnik123@hrm.cwgutlt.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

let db = null;

export default async function connect(database) {
  if (!db) {
    try {
      await client.connect();
      db = client.db(database);
    } catch (err) {
      console.error("Error connecting to MongoDB:", err);
      throw err;
    }
  }
  return db;
}
