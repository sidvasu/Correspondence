import { Router } from "express";
import { ObjectId } from "mongodb";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { getDB, getBucket } from "../config/db.js";
import { authenticateToken } from "../middleware/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();

// Loads the share page
router.get("/share.html", authenticateToken, (req, res) => {
  res.sendFile(join(__dirname, "../public", "share.html"));
});

// Displays a specific file to the user
router.get("/upload/:fileId", authenticateToken, async (req, res) => {
  try {
    const { fileId } = req.params;
    const db = getDB();
    const bucket = getBucket();

    const file = await db.collection("uploads.files").findOne({ _id: new ObjectId(fileId) });

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    /*
    if (!file.metadata.sharedWith.includes(req.user.username)) {
      return res.status(403).json({ error: "Not authorized" });
    }
    */

    const downloadStream = bucket.openDownloadStream(new ObjectId(fileId));
    downloadStream.on("file", (f) => res.set("Content-Type", f.contentType));
    downloadStream.pipe(res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to display file" });
  }
});

// Downloads a file to user's file system
router.get("/files/:fileId", authenticateToken, async (req, res) => {
  try {
    const { fileId } = req.params;
    const db = getDB();
    const bucket = getBucket();

    const file = await db.collection("uploads.files").findOne({ _id: new ObjectId(fileId) });
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    /*
    if (!file.metadata.sharedWith.includes(req.user.username)) {
      return res.status(403).json({ error: "Not authorized" });
    }
    */

    res.set("Content-Type", file.contentType);
    res.set("Content-Disposition", `attachment; filename="${file.filename}"`);
    bucket.openDownloadStream(new ObjectId(fileId)).pipe(res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to download file" });
  }
});

export default router;