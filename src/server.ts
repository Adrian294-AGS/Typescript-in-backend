import express from "express";
import dotenv from "dotenv";
import cookie from "cookie-parser";

dotenv.config();

const app = express();
const Port = Number(process.env['SERVER_PORT']);

app.use(express.json());
app.use(cookie());

app.listen(Port, () => {
	console.log(`Server running on port ${Port}`);
});

