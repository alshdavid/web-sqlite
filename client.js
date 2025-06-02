const MessageType = {
  Init: 0,
  Log: 1,
  Error: 2,
  Open: 3,
  Exec: 4,
  SelectValues: 5,
};

function genRef() {
  return Math.round(Math.random() * 100000);
}

function postMessage(target, data) {
  if (target instanceof SharedWorker) {
    target.port.postMessage(data);
  } else {
    target.postMessage(data);
  }
}

const USE_SHARED_WORKER = "SharedWorker" in globalThis;

export class Sqlite {
  /** @type {Map<number, [(value: any) => void, (error: any) => void]} */
  #refs;
  /** @type {SharedWorker | Worker} */
  #worker;

  static async connect({
    workerPath,
    workerType = USE_SHARED_WORKER ? "sharedworker" : "webworker",
  } = {}) {
    const worker =
      workerType === "sharedworker"
        ? new SharedWorker(
            workerPath || import.meta.resolve("./shared-worker.js"),
            { type: "module" }
          )
        : new Worker(workerPath || import.meta.resolve("./web-worker.js"), {
            type: "module",
          });

    const refs = new Map();
    const self = new Sqlite();

    if (worker instanceof SharedWorker) {
      worker.port.onmessage = self.#onResponse;
    } else {
      worker.onmessage = self.#onResponse;
    }
    self.#worker = worker;
    self.#refs = refs;
    return self;
  }

  async open(options) {
    await new Promise((res, rej) => {
      const ref = genRef();
      this.#refs.set(ref, [res, rej]);
      postMessage(this.#worker, [ref, MessageType.Open, options]);
    });

    return new Database(options.name, this.#worker, this.#refs);
  }

  #onResponse = ({ data }) => {
    const [ref, value, error] = data;
    const resolver = this.#refs.get(ref);
    if (!resolver) throw new Error("Unable to find pending Promise");
    else if (error) resolver[1](error);
    else resolver[0](value);
    this.#refs.delete(ref);
  };
}

export class Database {
  /** @type {Map<number, [(value: any) => void, (error: any) => void]} */
  #refs;
  /** @type {SharedWorker | Worker} */
  #worker;
  /** @type {string} */
  #name;

  constructor(name, worker, refs) {
    this.#name = name;
    this.#worker = worker;
    this.#refs = refs;
  }

  exec(sql) {
    return new Promise((res, rej) => {
      const ref = genRef();
      this.#refs.set(ref, [res, rej]);
      postMessage(this.#worker, [
        ref,
        MessageType.Exec,
        { name: this.#name, sql },
      ]);
    });
  }
}
