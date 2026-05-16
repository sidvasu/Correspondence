import { Router } from "express";
import { ObjectId } from "mongodb";
import multer from "multer";
import { Readable } from "stream";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { getDB, getBucket } from "../config/db.js";
import { authenticateToken } from "../middleware/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Loads the share page
router.get("/share.html", authenticateToken, (req, res) => {
  res.sendFile(join(__dirname, "../public", "share.html"));
});

// Gets the files from the database
router.get("/files", authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const files = await db
      .collection("uploads.files")
      .find({})
      .sort({ uploadDate: -1 })
      .toArray();

    const formatted = files.map((file) => ({
      id: file._id,
      filename: file.filename,
      owner: file.metadata.uploadedBy,
      ownedByCurrentUser: file.metadata?.uploadedBy === req.user.username,
      length: file.length,
      uploadDate: file.uploadDate,
      contentType: file.contentType,
    }));

    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch files" });
  }
});

// Displays a specific file to the user
router.get("/upload/:fileId", authenticateToken, (req, res) => {
  const { fileId } = req.params;
  const bucket = getBucket();
  const downloadStream = bucket.openDownloadStream(new ObjectId(fileId));

  downloadStream.on("file", (file) => {
    res.set("Content-Type", file.contentType);
  });

  downloadStream.pipe(res);
});

// Uploads a file to the database
router.post("/upload", authenticateToken, upload.single("file"), async (req, res) => {
  try {
    const { originalname, mimetype, buffer } = req.file;
    const db = getDB();
    const bucket = getBucket();

    const uploadStream = bucket.openUploadStream(originalname, {
      contentType: mimetype,
      metadata: { uploadedBy: req.user.username },
    });

    const readBuffer = new Readable();
    readBuffer.push(buffer);
    readBuffer.push(null);

    readBuffer
      .pipe(uploadStream)
      .on("error", (err) => {
        console.error(err);
        res.status(500).json({ error: "Upload failed" });
      })
      .on("finish", async () => {
        try {
          const uploadedFile = await db
            .collection("uploads.files")
            .findOne({ _id: uploadStream.id });

          res.json({
            message: "Upload successful",
            file: {
              id: uploadedFile._id,
              filename: uploadedFile.filename,
              owner: uploadedFile.metadata.uploadedBy,
              ownedByCurrentUser: true,
              contentType: uploadedFile.contentType,
              uploadDate: uploadedFile.uploadDate,
            },
          });
        } catch (error) {
          console.error(error);
          res.status(500).json({ error: "Failed to fetch uploaded file metadata" });
        }
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Upload failed" });
  }
});

// Deletes a file from the database
router.delete("/files/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const fileId = new ObjectId(id);
    const db = getDB();
    const bucket = getBucket();

    const file = await db.collection("uploads.files").findOne({ _id: fileId });

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    if (file.metadata.uploadedBy !== req.user.username) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await bucket.delete(fileId);
    res.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete file" });
  }
});

// Renames a file
router.patch("/files/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { filename } = req.body;
        const fileId = new ObjectId(id);
        const db = getDB();

        if (!filename) {
            return res.status(400).json({ error: "Filename cannot be empty" });
        }

        const file = await db.collection("uploads.files").findOne({ _id: fileId });

        if (!file) {
            return res.status(404).json({ error: "File not found" });
        }

        if (file.metadata.uploadedBy !== req.user.username) {
            return res.status(403).json({ error: "Not authorized" });
        }

        await db.collection("uploads.files").updateOne(
            { _id: fileId }, { $set: { 'filename': filename } } 
        );

        res.json({ message: "File renamed successfully", filename });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete file" });
    }
});

export default router;