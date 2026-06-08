/**
 * tests/unit/setup.js
 * Mocks localStorage globally for Node.js test environment.
 */

class LocalStorageMock {
  constructor() {
    this.store = {};
    this.shouldThrow = false;
  }

  clear() {
    this.store = {};
  }

  getItem(key) {
    if (this.shouldThrow) {
      throw new Error("Simulated localStorage error");
    }
    return this.store[key] || null;
  }

  setItem(key, value) {
    if (this.shouldThrow) {
      throw new Error("Simulated localStorage error");
    }
    this.store[key] = String(value);
  }

  removeItem(key) {
    if (this.shouldThrow) {
      throw new Error("Simulated localStorage error");
    }
    delete this.store[key];
  }

  get length() {
    return Object.keys(this.store).length;
  }

  key(index) {
    return Object.keys(this.store)[index] || null;
  }
}

globalThis.localStorage = new LocalStorageMock();
