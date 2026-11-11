const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");

const RECEIPT_DIR = path.join(__dirname, "..", "private", "receipts");
const IMAGE_DIR = path.join(__dirname, "..", "uploads", "campaigns");
const IMAGE_URL = "/uploads/campaigns/";

const receiptUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
});

// Check the real file bytes, not the name or the type the browser claims
function sniff(buf) {
  if (buf.length > 4 && buf.subarray(0, 4).toString("latin1") === "%PDF") return "pdf";
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (
    buf.length > 8 &&
    buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  )
    return "png";
  if (
    buf.length > 12 &&
    buf.subarray(0, 4).toString("latin1") === "RIFF" &&
    buf.subarray(8, 12).toString("latin1") === "WEBP"
  )
    return "webp";
  return null;
}

const randomName = (ext) => `${crypto.randomBytes(16).toString("hex")}.${ext}`;

// Returns the stored file name. Throws an Error with a clear message if the file is not allowed.
async function saveReceipt(file) {
  if (!file) throw new Error("Upload your payment receipt");
  const type = sniff(file.buffer);
  if (!["pdf", "jpg", "png"].includes(type)) throw new Error("Receipt must be a PDF, JPG or PNG file");
  await fs.mkdir(RECEIPT_DIR, { recursive: true });
  const name = randomName(type);
  await fs.writeFile(path.join(RECEIPT_DIR, name), file.buffer);
  return name;
}

// Returns the public URL path of the saved image
async function saveImage(file) {
  const type = sniff(file.buffer);
  if (!["jpg", "png", "webp"].includes(type)) throw new Error("Image must be a JPG, PNG or WebP file");
  await fs.mkdir(IMAGE_DIR, { recursive: true });
  const name = randomName(type);
  await fs.writeFile(path.join(IMAGE_DIR, name), file.buffer);
  return `${IMAGE_URL}${name}`;
}

// basename stops anything like ../ from escaping the folder
const receiptPath = (name) => path.join(RECEIPT_DIR, path.basename(name));
const removeReceipt = (name) => (name ? fs.unlink(receiptPath(name)).catch(() => {}) : null);
const removeImage = (url) =>
  url && url.startsWith(IMAGE_URL)
    ? fs.unlink(path.join(IMAGE_DIR, path.basename(url))).catch(() => {})
    : null;

module.exports = {
  receiptUpload,
  imageUpload,
  saveReceipt,
  saveImage,
  receiptPath,
  removeReceipt,
  removeImage,
};