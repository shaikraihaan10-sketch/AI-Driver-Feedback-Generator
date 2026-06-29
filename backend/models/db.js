const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let useFallback = false;

// Attempt to connect to MongoDB
const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.log('⚠️ No MONGODB_URI found in environment. Switching to Local File Database fallback.');
    useFallback = true;
    return;
  }

  try {
    // 2-second timeout for fast fallback
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log('🔌 Connected to MongoDB successfully.');
    useFallback = false;
  } catch (error) {
    console.error('❌ MongoDB connection failed. Falling back to Local File Database.');
    console.log('ℹ️ Reason:', error.message);
    useFallback = true;
  }
};

// Generic File-based Model fallback class
class FileModel {
  constructor(name) {
    this.name = name;
    this.filePath = path.join(DATA_DIR, `${name.toLowerCase()}s.json`);
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([], null, 2));
    }
  }

  _read() {
    try {
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  }

  _write(data) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  async find(query = {}) {
    let items = this._read();
    return items.filter(item => {
      for (let key in query) {
        // Simple search logic
        if (query[key] !== undefined && item[key] !== query[key]) {
          // If query key is an object (like $regex or $in), handle it simply
          if (query[key] && typeof query[key] === 'object') {
            if (query[key].$regex) {
              const regex = new RegExp(query[key].$regex, 'i');
              if (!regex.test(item[key])) return false;
              continue;
            }
          }
          return false;
        }
      }
      return true;
    });
  }

  async findOne(query = {}) {
    const items = await this.find(query);
    return items[0] || null;
  }

  async findById(id) {
    const items = this._read();
    return items.find(item => item._id === id || item.id === id) || null;
  }

  async create(data) {
    const items = this._read();
    const newItem = {
      _id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    };
    items.push(newItem);
    this._write(items);
    return newItem;
  }

  async findByIdAndUpdate(id, data, options = {}) {
    const items = this._read();
    const index = items.findIndex(item => item._id === id || item.id === id);
    if (index === -1) return null;

    items[index] = {
      ...items[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this._write(items);
    return items[index];
  }

  async findByIdAndDelete(id) {
    const items = this._read();
    const index = items.findIndex(item => item._id === id || item.id === id);
    if (index === -1) return null;
    const deleted = items.splice(index, 1)[0];
    this._write(items);
    return deleted;
  }

  async countDocuments(query = {}) {
    const items = await this.find(query);
    return items.length;
  }
}

// Wrapper function to define a model
const defineModel = (name, mongooseModel) => {
  const fileModel = new FileModel(name);

  return {
    find: async (query) => {
      if (useFallback) {
        return fileModel.find(query);
      }
      return mongooseModel.find(query).lean();
    },
    findOne: async (query) => {
      if (useFallback) {
        return fileModel.findOne(query);
      }
      return mongooseModel.findOne(query).lean();
    },
    findById: async (id) => {
      if (useFallback) {
        return fileModel.findById(id);
      }
      return mongooseModel.findById(id).lean();
    },
    create: async (data) => {
      if (useFallback) {
        return fileModel.create(data);
      }
      const newItem = new mongooseModel(data);
      const saved = await newItem.save();
      return saved.toObject();
    },
    findByIdAndUpdate: async (id, data, options = { new: true }) => {
      if (useFallback) {
        return fileModel.findByIdAndUpdate(id, data, options);
      }
      return mongooseModel.findByIdAndUpdate(id, data, options).lean();
    },
    findByIdAndDelete: async (id) => {
      if (useFallback) {
        return fileModel.findByIdAndDelete(id);
      }
      return mongooseModel.findByIdAndDelete(id).lean();
    },
    countDocuments: async (query) => {
      if (useFallback) {
        return fileModel.countDocuments(query);
      }
      return mongooseModel.countDocuments(query);
    },
    // Expose direct access for custom logic
    isFallback: () => useFallback,
    getRawData: () => {
      if (useFallback) {
        return fileModel._read();
      }
      return null;
    },
    writeRawData: (data) => {
      if (useFallback) {
        fileModel._write(data);
      }
    }
  };
};

module.exports = {
  connectDB,
  defineModel,
  isFallback: () => useFallback,
  getBackupData: () => {
    const backup = {};
    const files = fs.readdirSync(DATA_DIR);
    files.forEach(file => {
      if (file.endsWith('.json')) {
        const key = file.replace('.json', '');
        const data = fs.readFileSync(path.join(DATA_DIR, file), 'utf8');
        backup[key] = JSON.parse(data);
      }
    });
    return backup;
  },
  restoreBackupData: (backup) => {
    for (let key in backup) {
      const filePath = path.join(DATA_DIR, `${key}.json`);
      fs.writeFileSync(filePath, JSON.stringify(backup[key], null, 2));
    }
    return true;
  }
};
