import { RequestHandler } from "express";

export const uploadFiles: RequestHandler = async (req, res) => {
  try {
    if (!req.files || (!Array.isArray(req.files) && Object.keys(req.files).length === 0)) {
      return res.status(400).json({ error: "No files uploaded" });
    }
    
    let urls: string[] = [];
    
    if (Array.isArray(req.files)) {
      urls = req.files.map((file: any) => file.location || file.path);
    } else {
      // If it's a field object
      Object.values(req.files).forEach((fileArray: any) => {
        const fieldUrls = fileArray.map((file: any) => file.location || file.path);
        urls = [...urls, ...fieldUrls];
      });
    }
    
    res.json({ urls });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
