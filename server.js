import express from "express";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { MongoClient, ObjectId } from "mongodb";
import mongoose from "mongoose";

const app = express();
const port = 3000;

const uri = "mongodb://localhost:27017"

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.static(join(__dirname, 'public')));

app.get("/", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});