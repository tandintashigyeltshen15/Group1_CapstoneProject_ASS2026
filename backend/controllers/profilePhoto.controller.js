const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const prisma = require("../lib/prisma");

const DIR = path.join(__dirname, "..", "uploads", "avatars");
const URL_PREFIX = "/uploads/avatars/";

// Check the real file bytes, because the browser's file type claim can be faked
function detectType(buf) {
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

const deleteFile = async (photoUrl) => {
  if (!photoUrl || !photoUrl.startsWith(URL_PREFIX)) return;
  // basename stops anything like ../ from escaping the folder
  await fs.unlink(path.join(DIR, path.basename(photoUrl))).catch(() => {});
};

// POST /api/profile-photo  (multipart, field name "photo")
exports.uploadPhoto = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Choose a photo to upload" });

    const type = detectType(req.file.buffer);
    if (!type) return res.status(400).json({ message: "Use a JPG, PNG or WebP image" });

    await fs.mkdir(DIR, { recursive: true });
    const name = `${req.user.id}-${crypto.randomBytes(8).toString("hex")}.${type}`;
    await fs.writeFile(path.join(DIR, name), req.file.buffer);

    const old = await prisma.user.findUnique({
      where: { UserID: req.user.id },
      select: { ProfilePhoto: true },
    });
    const photoUrl = `${URL_PREFIX}${name}`;
    await prisma.user.update({ where: { UserID: req.user.id }, data: { ProfilePhoto: photoUrl } });
    await deleteFile(old?.ProfilePhoto);

    res.json({ photoUrl });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/profile-photo
exports.removePhoto = async (req, res, next) => {
  try {
    const old = await prisma.user.findUnique({
      where: { UserID: req.user.id },
      select: { ProfilePhoto: true },
    });
    await prisma.user.update({ where: { UserID: req.user.id }, data: { ProfilePhoto: null } });
    await deleteFile(old?.ProfilePhoto);
    res.json({ photoUrl: "" });
  } catch (err) {
    next(err);
  }
};