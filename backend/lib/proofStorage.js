const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");

const PROOF_DIR = path.join(__dirname, "..", "private", "proofs");

// multer keeps the upload in memory (max 5 MB, one file)
const uploadProof = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

// Check the real file bytes, not the name or the type the browser claims
function detectType(buf) {
  if (buf.length > 4 && buf.subarray(0, 4).toString("latin1") === "%PDF") return "pdf";
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (
    buf.length > 8 &&
    buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  )
    return "png";
  return null;
}

// Saves a proof file and returns its stored name, or throws an Error with a clear message
async function saveProof(file) {
  if (!file) throw new Error("Upload your proof of graduation");
  const type = detectType(file.buffer);
  if (!type) throw new Error("Proof of graduation must be a PDF, JPG or PNG file");
  await fs.mkdir(PROOF_DIR, { recursive: true });
  const name = `${crypto.randomBytes(16).toString("hex")}.${type}`;
  await fs.writeFile(path.join(PROOF_DIR, name), file.buffer);
  return name;
}

const proofPath = (name) => path.join(PROOF_DIR, path.basename(name));

// Deletes a stored proof (used when registration fails after the file was saved)
const removeProof = (name) => fs.unlink(proofPath(name)).catch(() => {});

module.exports = { uploadProof, saveProof, proofPath, removeProof };