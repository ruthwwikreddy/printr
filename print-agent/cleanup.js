const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '..', 'uploads');

function runDailyCleanup() {
  console.log(`Running document retention policy sweep on uploads folder: ${uploadsDir}`);
  if (!fs.existsSync(uploadsDir)) return;

  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      console.error('Failed to read uploads folder during daemon cleanup:', err);
      return;
    }

    const now = Date.now();
    const expiryMs = 24 * 60 * 60 * 1000; // 24 Hours

    files.forEach((file) => {
      const filePath = path.join(uploadsDir, file);
      fs.stat(filePath, (err, stats) => {
        if (err) return;

        if (now - stats.mtimeMs > expiryMs) {
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error(`Failed to delete expired file ${file}:`, err);
            } else {
              console.log(`✓ Retained file deleted: ${file}`);
            }
          });
        }
      });
    });
  });
}

// Run cleanup immediately, then repeat every 6 hours
runDailyCleanup();
setInterval(runDailyCleanup, 6 * 60 * 60 * 1000);
