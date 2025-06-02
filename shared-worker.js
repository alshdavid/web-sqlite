import SQLiteESMFactory from './wa-sqlite/dist/wa-sqlite-async.mjs';
import * as SQLite from './wa-sqlite/src/sqlite-api.js';
import { IDBBatchAtomicVFS as MyVFS } from './wa-sqlite/src/examples/IDBBatchAtomicVFS.js';

const MessageType = {
  Init: 0,
  Log: 1,
  Error: 2,
  Open: 3,
  Exec: 4,
  SelectValues: 5,
}

const databases = new Map();
let module
let sqlite3
let vfs

globalThis.onconnect = async (e) => {
  /** @type {MessagePort} */
  const port = e.ports[0];
  
  port.onmessage = async ({ data: clientData }) => {
    const [ref, t, payload] = clientData;

    try {
      if (t === MessageType.Open) {
        const { name } = payload;

        if (!module) {
          module = await SQLiteESMFactory();
          sqlite3 = SQLite.Factory(module);
          vfs = await MyVFS.create('sqlite::vfs', module);
          sqlite3.vfs_register(vfs, true);
        }
        const db = await sqlite3.open_v2(name)
        databases.set(name, db);
        port.postMessage([ref, true, undefined]);
      } 
      //
      else if (t === MessageType.Exec) {
        const { name, sql } = payload;

        const db = databases.get(name);
        if (!db) {
          port.postMessage([ref, undefined, "Database not found"]);
          return;
        }
        const result = []
        await sqlite3.exec(db, sql, (row, col) => {
          const entry = {}
          for (const [i, key] of col.entries()) {
            entry[key] = row[i]
          }
          result.push(entry)
        });
        port.postMessage([ref, result, undefined]);
      } 
    } catch (error) {
      port.postMessage([ref, undefined, error.toString()]);
      console.error(error)
    }
  };
}