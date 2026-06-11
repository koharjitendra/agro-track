class TTLCache {
  constructor(defaultTTLMs = 600000) { // default 10 minutes
    this.cache = new Map();
    this.defaultTTLMs = defaultTTLMs;
  }

  set(key, value, ttlMs = this.defaultTTLMs) {
    const expiresAt = Date.now() + ttlMs;
    this.cache.set(key, { value, expiresAt });
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }
}

export default new TTLCache();
