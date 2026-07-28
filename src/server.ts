import express from "express";
import "dotenv/config";
import cookie from "cookie-parser";
import authRoute from "./routes/authRoute.js";
import { globalLimiter } from "./middleware/buildLimiter.js";
import { mongooseConn } from "./config/mongooseConn.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";
import { fileErrorHandler } from "./middleware/fileErrorHandler.js";

const app = express();
const Port = Number(process.env["SERVER_PORT"]);

app.use(express.json());
app.use(express.static("uploads"));
app.use(cookie());
app.use(globalLimiter);

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/auth", authRoute);

app.use(fileErrorHandler);

mongooseConn().then(() => {
  app.listen(Port, () => {
    console.log(`Server running on port ${Port}`);
  });
});
