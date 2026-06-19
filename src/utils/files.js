const fs = require('fs/promises');

async function deleteFileIfExists(filePath) {
  if (!filePath) return;

  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

module.exports = {
  deleteFileIfExists
};
