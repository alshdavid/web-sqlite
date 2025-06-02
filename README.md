# Sqlite Wasm in a SharedWorker or WebWorker

This is a basic implementation of a persistent cross-tab sqlite database for the browser

On desktop apps it will use `SharedWorker`, on mobile devices it will use `WebWorker`.

The database is persisted using indexedDB

## Usage

Vendor the repo into your current project

```html
<body>
  <script type="module">
    import { Sqlite } from './vendor/sqlite/client.js'

    const conn = await Sqlite.connect()

    const db = await conn.open({ name: 'test_db' })

    await db.exec(`CREATE TABLE IF NOT EXISTS test_table ("id" TEXT UNIQUE, "val" TEXT)`);

    await db.exec("INSERT INTO test_table (id, val) VALUES ('1', 'v1')")
    await db.exec("INSERT INTO test_table (id, val) VALUES ('2', 'v2')")
    await db.exec("INSERT INTO test_table (id, val) VALUES ('3', 'v3')")

    const result = await db.exec("SELECT * FROM test_table")
    console.log(result)
  </script>
</body>
```