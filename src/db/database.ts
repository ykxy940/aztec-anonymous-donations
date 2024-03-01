const sqlite3 = require("sqlite3").verbose();

export async function initializeDatabase() {
  const db = new sqlite3.Database("./aztec.db", (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log("Connected to the aztec database.");
  });
}

export async function createTable() {
  db.run(
    `CREATE TABLE IF NOT EXISTS aztecaddresses (
    fid INTEGER PRIMARY KEY,
    address TEXT NOT NULL
)`,
    (err) => {
      if (err) {
        console.error(err.message);
      }
      console.log("aztecaddresses table created.");
    }
  );
}

export function checkAztecAddress(fid: number) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT address FROM aztecaddresses WHERE fid = ?`,
      [fid],
      (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          // Address already exists for this fid
          resolve(row.address);
        }
      }
    );
  });
}

export function storeAztecAddress(fid: number, address: string) {
  return new Promise((resolve, reject) => {
    // Insert new address for this fid
    db.run(
      `INSERT INTO aztecaddresses(fid, address) VALUES(?, ?)`,
      [fid, address],
      function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(address);
        }
      }
    );
  });
}

