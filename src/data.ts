import localforage from "localforage";

type GameData = {
  flags: Map<string, boolean>;
  options: Map<string, any>;
  progress: {
    level: number;
  };
};

const store: GameData = {
  flags: new Map(),
  options: new Map(),
  progress: {
    level: 0,
  },
};

async function saveGameData() {
  localforage.config({
    name: "ld-49-unstable",
    storeName: "data",
  });
  await localforage.setItem("flags", store.flags);
  await localforage.setItem("options", store.options);
  await localforage.setItem("progress", store.progress);
}

async function loadGameData() {
  localforage.config({
    name: "ld-49-unstable",
    storeName: "data",
  });
  store.flags = (await localforage.getItem("flags")) ?? new Map();
  store.options = (await localforage.getItem("options")) ?? new Map();
  store.progress = (await localforage.getItem("progress")) ?? {
    level: 0,
  };
}

function getFlag(key: string) {
  if (store.flags.has(key)) {
    return store.flags.get(key);
  }
  return false;
}

function setFlag(key: string, value: boolean) {
  store.flags.set(key, value);
}

function getStore() {
  return store;
}

export { saveGameData, loadGameData, getStore, getFlag, setFlag };
