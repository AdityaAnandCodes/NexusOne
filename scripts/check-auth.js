require('dotenv').config();
const { MongoClient } = require('mongodb');

async function checkAuthCollections() {
  const uri = 'mongodb+srv://rakshabvwork:lKbKnIm3mzGaU4kd@cluster0.affyx.mongodb.net/nexusone_main?retryWrites=true&w=majority&appName=Cluster0';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('nexusone_main');
    
    console.log('\n=== Checking NextAuth Sessions ===');
    const sessions = await db.collection('sessions').find({}).toArray();
    console.log('Sessions found:', sessions.length);
    sessions.forEach(session => {
      console.log('Session:', {
        userId: session.userId,
        expires: session.expires,
        sessionToken: session.sessionToken?.substring(0, 20) + '...'
      });
    });
    
    console.log('\n=== Checking NextAuth Accounts ===');
    const accounts = await db.collection('accounts').find({}).toArray();
    console.log('Accounts found:', accounts.length);
    accounts.forEach(account => {
      console.log('Account:', {
        userId: account.userId,
        provider: account.provider,
        providerAccountId: account.providerAccountId
      });
    });
    
    // Clear the sessions if they exist
    if (sessions.length > 0) {
      console.log('\n🧹 Clearing sessions...');
      const deleteResult = await db.collection('sessions').deleteMany({});
      console.log('Deleted sessions:', deleteResult.deletedCount);
    }
    
    if (accounts.length > 0) {
      console.log('\n🧹 Clearing accounts...');
      const deleteResult = await db.collection('accounts').deleteMany({});
      console.log('Deleted accounts:', deleteResult.deletedCount);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkAuthCollections();
