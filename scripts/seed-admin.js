const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

async function seed() {
  let db = { users: [], clients: [] };
  if (fs.existsSync(DB_PATH)) {
    db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  }

  const existing = db.users.find(u => u.email === 'admin@founderleddash.com');
  if (existing) {
    console.log('Admin already exists');
    return;
  }

  const hash = await bcrypt.hash('admin123', 12);
  db.users.push({
    id: randomUUID(),
    email: 'admin@founderleddash.com',
    passwordHash: hash,
    role: 'admin',
    name: 'Admin',
    createdAt: new Date().toISOString(),
  });

  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  console.log('✅ Admin created: admin@founderleddash.com / admin123');
  console.log('⚠️  Change this password immediately after first login!');
}

seed();
