import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { backup, DatabaseSync } from "node:sqlite";

const source = process.env.KAIROS_DB ?? "/data/kairos.sqlite";
const destination = process.argv[2];
if (!destination) throw new Error("Usage: node server/backup.mjs <destination>");
mkdirSync(dirname(destination), { recursive: true });
const sourceDb = new DatabaseSync(source, { readOnly: true });
await backup(sourceDb, destination);
sourceDb.close();
console.log(destination);
