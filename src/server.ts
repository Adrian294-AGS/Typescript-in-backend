import express from "express";
import "dotenv/config";
import cookie from "cookie-parser";
import authRoute from "./routes/authRoute.js";

const app = express();
const Port = Number(process.env['SERVER_PORT']);

app.use(express.json());
app.use(cookie());

app.use('/api/auth', authRoute);

app.listen(Port, () => {
	console.log(`Server running on port ${Port}`);
});

