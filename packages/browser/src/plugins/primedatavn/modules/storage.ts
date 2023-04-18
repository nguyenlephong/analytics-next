//Refs: https://localforage.github.io/localForage
import localforage from "localforage";

// This will use a different driver order.
localforage.config({
  driver: [localforage.INDEXEDDB, localforage.WEBSQL, localforage.LOCALSTORAGE],
  version: 1.0,
  name: "primedata_sdk",
  description: "This is storage data support JS SDK work powerful",
});


// Create table 1 in primedata_sdk is device
const deviceStorage = localforage.createInstance({
  name: "primedata_sdk",
  storeName: 'device',
  description: "Device information",
});

export {
  deviceStorage,
  localforage
}
