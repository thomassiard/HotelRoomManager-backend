import { MongoClient, ServerApiVersion } from "mongodb";
const uri =
  "mongodb+srv://admin:admin123@hrm.cwgutlt.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

let db = null;

export default (database) => {
  return new Promise((resolve, reject) => {
    if (db && client.connected) {
      resolve(db);
    } else {
      try {
        db = client.db(database);
        resolve(db);
      } catch {
        (err) => reject(err);
      }
    }
  });
};
