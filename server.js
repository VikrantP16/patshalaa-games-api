require("dotenv").config();
const express = require("express");
const AWS = require("aws-sdk");
const cors = require("cors");

const app = express();
app.use(cors());

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

app.get("/games", async (req, res) => {
  try {
    const { grade, topic } = req.query;
    if (!grade) return res.status(400).json({ error: "Grade is required" });

    const prefix = `class_${grade.toLowerCase()}/thumbnails/${topic ? `${topic}/` : ""}`;
    
    const params = {
      Bucket: BUCKET_NAME,
      Prefix: prefix,
    };

    const data = await s3.listObjectsV2(params).promise();
    const files = data.Contents
      .filter((file) => file.Key.match(/\.(png|jpg|jpeg|gif)$/i)) // Only image files
      .map((file) => {
        const filename = file.Key.split("/").pop();
        return {
          title: filename.replace(/^\d+th_/, "").replace(/_/g, " ").replace(/\.\w+$/, ""),
          image: `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${file.Key}`,
        };
      });

    res.json(files);
  } catch (error) {
    console.error("Error fetching games:", error);
    res.status(500).json({ error: "Failed to fetch games" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

console.log("AWS Access Key:", process.env.AWS_ACCESS_KEY_ID);
console.log("AWS Secret Key:", process.env.AWS_SECRET_ACCESS_KEY);
console.log("AWS Region:", process.env.AWS_REGION);
console.log("S3 Bucket Name:", process.env.S3_BUCKET_NAME);
