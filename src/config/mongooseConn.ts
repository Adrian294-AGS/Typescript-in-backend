import mongoose from "mongoose";

const mongodbUri = process.env["MONGODB_URI"] as string;
if (!mongodbUri) throw new Error("MongoDb URI is Undefine");

export const mongooseConn = async (): Promise<void> => {
  try {
    if (mongoose.connection.readyState === 1) return;
    await mongoose.connect(mongodbUri);
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
    console.log("MongoDB Connected.......");
  } catch (error) {
    throw new Error("MOngo DB ERROR");
  }
};
