import express from "express";
import "dotenv/config";
import cookie from "cookie-parser";
import authRoute from "./routes/authRoute.js";
import { globalLimiter } from "./middleware/buildLimiter.js";
import { mongooseConn } from "./config/mongooseConn.js";

const app = express();
const Port = Number(process.env["SERVER_PORT"]);

app.use(express.json());
app.use(cookie());
app.use(globalLimiter);

app.use("/api/auth", authRoute);

mongooseConn().then(() => {
  app.listen(Port, () => {
    console.log(`Server running on port ${Port}`);
  });
});
