import express from "express";
import "dotenv/config";
import cookie from "cookie-parser";
import authRoute from "./routes/authRoute.js";
import paymentRoute from "./routes/paymentRoute.js";
import { paymongoWebhook } from "./controllers/paymentController.js";
import { globalLimiter } from "./middleware/buildLimiter.js";
import { mongooseConn } from "./config/mongooseConn.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";
import { fileErrorHandler } from "./middleware/fileErrorHandler.js";
import passport from "passport";
import "./services/googleOauth.js";

const app = express();
const Port = Number(process.env["SERVER_PORT"]);

app.post(
  "/api/webhooks/paymongo",
  express.raw({ type: "application/json" }),
  paymongoWebhook,
);

app.use(express.json());
app.use(express.static("uploads"));
app.use(cookie());
app.use(globalLimiter);

app.use(passport.initialize());

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/auth", authRoute);
app.use("/api/payments", paymentRoute);

app.use(fileErrorHandler);

mongooseConn().then(() => {
  app.listen(Port, () => {
    console.log(`Server running on port ${Port}`);
  });
});
