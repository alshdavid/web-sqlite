export type SqliteConnectOptions = {
  workerPath?: string
  workerType?: 'webworker' | 'sharedworker'
}

export type SqliteOpenOptions = {
  name: string
}

export declare class Sqlite {
  static connect(options?: SqliteConnectOptions): Promise<Sqlite>
  open(options?: SqliteOpenOptions): Promise<Database>
}

export declare class Database {
  exec<T extends { [key: string]: any }>(sql: string): Promise<Array<T>>
}
