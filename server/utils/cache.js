const cache = new Map();

exports.setCache = (key, value, ttl = 60000) => {
  cache.set(key, value);
  setTimeout(() => cache.delete(key), ttl);
};

exports.getCache = (key) => cache.get(key);