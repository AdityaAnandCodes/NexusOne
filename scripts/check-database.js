const { MongoClient } = require('mongodb');

async function checkDatabase() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/nexusone');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    console.log('\n=== Checking Users Collection ===');
    const users = await db.collection('users').find({}).toArray();
    console.log('All users:', users);
    
    console.log('\n=== Checking Companies Collection ===');
    const companies = await db.collection('companies').find({}).toArray();
    console.log('All companies:', companies);
    
    console.log('\n=== Checking NextAuth Sessions ===');
    const sessions = await db.collection('sessions').find({}).toArray();
    console.log('All sessions:', sessions);
    
    console.log('\n=== Checking NextAuth Accounts ===');
    const accounts = await db.collection('accounts').find({}).toArray();
    console.log('All accounts:', accounts);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkDatabase();
