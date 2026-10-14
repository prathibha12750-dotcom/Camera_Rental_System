const fs = require("fs/promises");

const ALLOWED_TYPES = {
  "image/jpeg": {
    extension: ".jpg",
    signature: Buffer.from([0xff, 0xd8, 0xff]),
  },
  "image/png": {
    extension: ".png",
    signature: Buffer.from([
      0x89, 0x50, 0x4e, 0x47,
      0x0d, 0x0a, 0x1a, 0x0a,
    ]),
  },
  "application/pdf": {
    extension: ".pdf",
    signature: Buffer.from("%PDF-"),
  },
};

const validatePaymentReceipt = async (file) => {
  if (!file?.path) {
    return false;
  }

  const handle = await fs.open(file.path, "r");

  try {
    const buffer = Buffer.alloc(8);

    const { bytesRead } = await handle.read(
      buffer,
      0,
      buffer.length,
      0
    );

    const expected = ALLOWED_TYPES[file.mimetype];

    if (!expected) {
      return false;
    }

    if (bytesRead < expected.signature.length) {
      return false;
    }

    return buffer
      .subarray(0, expected.signature.length)
      .equals(expected.signature);
  } finally {
    await handle.close();
  }
};

module.exports = validatePaymentReceipt;