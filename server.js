import env from "dotenv";
env.config();
 
import express from "express";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
 
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
 
const app = express();
 
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
 
app.use(express.static(join(__dirname, "public")));
app.use(express.json());
 
await connectDB();
 
app.use(authRoutes);
app.use(fileRoutes);
 
app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "public", "index.html"));
});
 
app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});