// Lightweight Promise-based wrapper around browser IndexedDB
const DB_NAME = 'FinQuestDB';
const DB_VERSION = 1;

let dbInstance = null;

export const initDB = () => {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (e) => {
      console.error('Database failed to open', e);
      reject(e);
    };

    request.onsuccess = (e) => {
      dbInstance = e.target.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (e) => {
      const db = e.target.result;

      // 1. Users Store
      if (!db.objectStoreNames.contains('users')) {
        db.createObjectStore('users', { keyPath: 'id' });
      }

      // 2. Transactions Store
      if (!db.objectStoreNames.contains('transactions')) {
        const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
        txStore.createIndex('userId', 'userId', { unique: false });
        txStore.createIndex('date', 'date', { unique: false });
      }

      // 3. Challenges Store
      if (!db.objectStoreNames.contains('challenges')) {
        const challengeStore = db.createObjectStore('challenges', { keyPath: 'id' });
        challengeStore.createIndex('userId', 'userId', { unique: false });
      }

      // 4. Roommate Split Store
      if (!db.objectStoreNames.contains('splits')) {
        const splitStore = db.createObjectStore('splits', { keyPath: 'id' });
        splitStore.createIndex('userId', 'userId', { unique: false });
      }
    };
  });
};

// Generic operations helper
const getStore = async (storeName, mode = 'readonly') => {
  const db = await initDB();
  const transaction = db.transaction(storeName, mode);
  return transaction.objectStore(storeName);
};

export const db = {
  // Users API
  users: {
    get: async (id) => {
      const store = await getStore('users');
      return new Promise((resolve) => {
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result || null);
      });
    },
    getAll: async () => {
      const store = await getStore('users');
      return new Promise((resolve) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
      });
    },
    put: async (user) => {
      const store = await getStore('users', 'readwrite');
      return new Promise((resolve, reject) => {
        const request = store.put(user);
        request.onsuccess = () => resolve(user);
        request.onerror = (e) => reject(e);
      });
    },
    delete: async (id) => {
      const store = await getStore('users', 'readwrite');
      return new Promise((resolve) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve(true);
      });
    }
  },

  // Transactions API
  transactions: {
    getByUser: async (userId) => {
      const store = await getStore('transactions');
      const index = store.index('userId');
      return new Promise((resolve) => {
        const request = index.getAll(userId);
        request.onsuccess = () => {
          // Sort by date descending
          const results = request.result || [];
          results.sort((a, b) => new Date(b.date) - new Date(a.date));
          resolve(results);
        };
      });
    },
    put: async (transaction) => {
      const store = await getStore('transactions', 'readwrite');
      return new Promise((resolve, reject) => {
        const request = store.put(transaction);
        request.onsuccess = () => resolve(transaction);
        request.onerror = (e) => reject(e);
      });
    },
    delete: async (id) => {
      const store = await getStore('transactions', 'readwrite');
      return new Promise((resolve) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve(true);
      });
    }
  },

  // Challenges API
  challenges: {
    getByUser: async (userId) => {
      const store = await getStore('challenges');
      const index = store.index('userId');
      return new Promise((resolve) => {
        const request = index.getAll(userId);
        request.onsuccess = () => resolve(request.result || []);
      });
    },
    put: async (challenge) => {
      const store = await getStore('challenges', 'readwrite');
      return new Promise((resolve) => {
        const request = store.put(challenge);
        request.onsuccess = () => resolve(challenge);
      });
    }
  },

  // Splits API
  splits: {
    getByUser: async (userId) => {
      const store = await getStore('splits');
      const index = store.index('userId');
      return new Promise((resolve) => {
        const request = index.getAll(userId);
        request.onsuccess = () => resolve(request.result || []);
      });
    },
    put: async (split) => {
      const store = await getStore('splits', 'readwrite');
      return new Promise((resolve) => {
        const request = store.put(split);
        request.onsuccess = () => resolve(split);
      });
    },
    delete: async (id) => {
      const store = await getStore('splits', 'readwrite');
      return new Promise((resolve) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve(true);
      });
    }
  }
};
