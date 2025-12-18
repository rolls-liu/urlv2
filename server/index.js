const express = require('express');
const cors = require('cors');
const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 静态文件服务 - 提供前端构建产物
const buildPath = path.join(__dirname, 'build');
app.use(express.static(buildPath));

// 数据库初始化
const dataDir = process.env.DATA_DIR || __dirname;
const dbPath = path.join(dataDir, 'data.db');
let db;

async function initDatabase() {
  const SQL = await initSqlJs();
  
  // 如果数据库文件存在，加载它
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }
  
  // 创建表
  db.run(`
    CREATE TABLE IF NOT EXISTS stream_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      config TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS stream_history (
      id TEXT PRIMARY KEY,
      config TEXT NOT NULL,
      generated_urls TEXT NOT NULL,
      created_at DATETIME NOT NULL
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS play_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      config TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS play_history (
      id TEXT PRIMARY KEY,
      config TEXT NOT NULL,
      generated_urls TEXT NOT NULL,
      created_at DATETIME NOT NULL
    )
  `);
  
  saveDatabase();
}

function saveDatabase() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

// ==================== 推流配置 API ====================

// 保存最后一次推流配置
app.post('/api/stream/config', (req, res) => {
  try {
    const { config } = req.body;
    const configStr = JSON.stringify(config);
    
    db.run('DELETE FROM stream_config');
    db.run('INSERT INTO stream_config (config) VALUES (?)', [configStr]);
    saveDatabase();
    
    res.json({ success: true });
  } catch (error) {
    console.error('保存推流配置失败:', error);
    res.status(500).json({ error: '保存配置失败' });
  }
});

// 获取最后一次推流配置
app.get('/api/stream/config', (req, res) => {
  try {
    const result = db.exec('SELECT config FROM stream_config ORDER BY id DESC LIMIT 1');
    const config = result.length > 0 && result[0].values.length > 0 
      ? JSON.parse(result[0].values[0][0]) 
      : null;
    res.json({ config });
  } catch (error) {
    console.error('获取推流配置失败:', error);
    res.status(500).json({ error: '获取配置失败' });
  }
});

// ==================== 推流历史 API ====================

// 保存推流历史记录
app.post('/api/stream/history', (req, res) => {
  try {
    const { id, config, generatedUrls, createdAt } = req.body;
    
    db.run(`
      INSERT OR REPLACE INTO stream_history (id, config, generated_urls, created_at)
      VALUES (?, ?, ?, ?)
    `, [id, JSON.stringify(config), JSON.stringify(generatedUrls), createdAt]);
    
    // 保留最新100条记录
    db.run(`
      DELETE FROM stream_history WHERE id NOT IN (
        SELECT id FROM stream_history ORDER BY created_at DESC LIMIT 100
      )
    `);
    saveDatabase();
    
    res.json({ success: true });
  } catch (error) {
    console.error('保存推流历史失败:', error);
    res.status(500).json({ error: '保存历史失败' });
  }
});

// 获取推流历史记录
app.get('/api/stream/history', (req, res) => {
  try {
    const result = db.exec('SELECT * FROM stream_history ORDER BY created_at DESC LIMIT 100');
    const history = result.length > 0 ? result[0].values.map(row => ({
      id: row[0],
      config: JSON.parse(row[1]),
      generatedUrls: JSON.parse(row[2]),
      createdAt: row[3]
    })) : [];
    res.json({ history });
  } catch (error) {
    console.error('获取推流历史失败:', error);
    res.status(500).json({ error: '获取历史失败' });
  }
});

// 删除指定推流历史记录
app.delete('/api/stream/history/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.run('DELETE FROM stream_history WHERE id = ?', [id]);
    saveDatabase();
    res.json({ success: true });
  } catch (error) {
    console.error('删除推流历史失败:', error);
    res.status(500).json({ error: '删除历史失败' });
  }
});

// 清空推流历史记录
app.delete('/api/stream/history', (req, res) => {
  try {
    db.run('DELETE FROM stream_history');
    saveDatabase();
    res.json({ success: true });
  } catch (error) {
    console.error('清空推流历史失败:', error);
    res.status(500).json({ error: '清空历史失败' });
  }
});

// ==================== 播放配置 API ====================

// 保存最后一次播放配置
app.post('/api/play/config', (req, res) => {
  try {
    const { config } = req.body;
    const configStr = JSON.stringify(config);
    
    db.run('DELETE FROM play_config');
    db.run('INSERT INTO play_config (config) VALUES (?)', [configStr]);
    saveDatabase();
    
    res.json({ success: true });
  } catch (error) {
    console.error('保存播放配置失败:', error);
    res.status(500).json({ error: '保存配置失败' });
  }
});

// 获取最后一次播放配置
app.get('/api/play/config', (req, res) => {
  try {
    const result = db.exec('SELECT config FROM play_config ORDER BY id DESC LIMIT 1');
    const config = result.length > 0 && result[0].values.length > 0 
      ? JSON.parse(result[0].values[0][0]) 
      : null;
    res.json({ config });
  } catch (error) {
    console.error('获取播放配置失败:', error);
    res.status(500).json({ error: '获取配置失败' });
  }
});

// ==================== 播放历史 API ====================

// 保存播放历史记录
app.post('/api/play/history', (req, res) => {
  try {
    const { id, config, generatedUrls, createdAt } = req.body;
    
    db.run(`
      INSERT OR REPLACE INTO play_history (id, config, generated_urls, created_at)
      VALUES (?, ?, ?, ?)
    `, [id, JSON.stringify(config), JSON.stringify(generatedUrls), createdAt]);
    
    // 保留最新100条记录
    db.run(`
      DELETE FROM play_history WHERE id NOT IN (
        SELECT id FROM play_history ORDER BY created_at DESC LIMIT 100
      )
    `);
    saveDatabase();
    
    res.json({ success: true });
  } catch (error) {
    console.error('保存播放历史失败:', error);
    res.status(500).json({ error: '保存历史失败' });
  }
});

// 获取播放历史记录
app.get('/api/play/history', (req, res) => {
  try {
    const result = db.exec('SELECT * FROM play_history ORDER BY created_at DESC LIMIT 100');
    const history = result.length > 0 ? result[0].values.map(row => ({
      id: row[0],
      config: JSON.parse(row[1]),
      generatedUrls: JSON.parse(row[2]),
      createdAt: row[3]
    })) : [];
    res.json({ history });
  } catch (error) {
    console.error('获取播放历史失败:', error);
    res.status(500).json({ error: '获取历史失败' });
  }
});

// 删除指定播放历史记录
app.delete('/api/play/history/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.run('DELETE FROM play_history WHERE id = ?', [id]);
    saveDatabase();
    res.json({ success: true });
  } catch (error) {
    console.error('删除播放历史失败:', error);
    res.status(500).json({ error: '删除历史失败' });
  }
});

// 清空播放历史记录
app.delete('/api/play/history', (req, res) => {
  try {
    db.run('DELETE FROM play_history');
    saveDatabase();
    res.json({ success: true });
  } catch (error) {
    console.error('清空播放历史失败:', error);
    res.status(500).json({ error: '清空历史失败' });
  }
});

// 所有其他路由返回前端页面（支持前端路由）
app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

// 初始化数据库并启动服务器
initDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`服务器运行在 http://0.0.0.0:${PORT}`);
  });
}).catch(err => {
  console.error('数据库初始化失败:', err);
  process.exit(1);
});
