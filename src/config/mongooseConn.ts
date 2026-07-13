import mongoose from "mongoose";

export const mongooseConn = async (): Promise<void> => {
  const mongoDB = process.env["MONGODB_URI"] as string;

  try {
    const conn = await mongoose.connect(mongoDB, {
      dbName: "myapp",
    });
    conn.connection.on('error', (err) => {
        console.log("MONGODB ERROR: ", err);
    })
    process.on("SIGINT", async () => {
      await mongoose.disconnect();
    });
    console.log("MONGODB CONNECTED....");
  } catch (error) {
    console.log("MongoDb Disconnected");
  }
};
