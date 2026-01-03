import { exec } from "child_process";
import path from "path";
import fs from "fs";

export const runBackup = (req, res) => {
  return new Promise((resolve, reject) => {
    try {
      const backupRoot = path.join(process.cwd(), "backups");

      if (!fs.existsSync(backupRoot)) {
        fs.mkdirSync(backupRoot);
      }

      const folder = path.join(
        backupRoot,
        new Date().toISOString().replace(/[:.]/g, "-")
      );

      const command = `mongodump --uri="${process.env.MONGODB_URL}" --out="${folder}"`;

      exec(command, (error, stdout, stderr) => {
        if (error) {
          res.status(500).json({ message: stderr || error.message });
          return reject(new Error(stderr || error.message));
        }

        res.status(200).json({ message: "Backup successful", path: folder });
        resolve({ message: "Backup successful", path: folder });
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
      reject(err);
    }
  });
};


