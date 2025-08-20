// Debug script to identify Replit deployment issue
console.log('🔍 REPLIT DEPLOYMENT DEBUG SCRIPT');
console.log('='.repeat(50));

// Check if we're in Replit deployment
const isReplitDeployment = process.env.REPL_ID && process.env.REPLIT_DEPLOYMENT === '1';
console.log('Environment:', isReplitDeployment ? 'REPLIT DEPLOYMENT' : 'LOCAL/DEV');
console.log('REPL_ID:', process.env.REPL_ID || 'NOT SET');
console.log('REPLIT_DEPLOYMENT:', process.env.REPLIT_DEPLOYMENT || 'NOT SET');

// Check DATABASE_URL
console.log('\n📊 DATABASE_URL Analysis:');
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.log('❌ DATABASE_URL is NOT SET!');
} else {
  console.log('✅ DATABASE_URL is set');
  console.log('Length:', dbUrl.length);
  console.log('Starts with:', dbUrl.substring(0, 20) + '...');
  console.log('Ends with:', '...' + dbUrl.substring(dbUrl.length - 20));
  
  // Check for common issues
  console.log('\n🔍 Checking for common issues:');
  console.log('Has trailing spaces:', dbUrl !== dbUrl.trim() ? 'YES ❌' : 'NO ✅');
  console.log('Has newlines:', dbUrl.includes('\n') || dbUrl.includes('\r') ? 'YES ❌' : 'NO ✅');
  console.log('Has quotes:', dbUrl.includes('"') || dbUrl.includes("'") ? 'YES ❌' : 'NO ✅');
  
  // Parse URL
  try {
    const url = new URL(dbUrl);
    console.log('\n📝 Parsed URL components:');
    console.log('Protocol:', url.protocol);
    console.log('Username:', url.username);
    console.log('Password length:', url.password.length);
    console.log('Password:', url.password); // Show full password for debugging
    console.log('Host:', url.hostname);
    console.log('Port:', url.port || '5432 (default)');
    console.log('Database:', url.pathname.slice(1).split('?')[0]);
    console.log('SSL Mode:', url.searchParams.get('sslmode'));
    
    // Check for invisible characters in password
    console.log('\n🔍 Password byte analysis:');
    const passBytes = Buffer.from(url.password);
    console.log('Password bytes:', Array.from(passBytes).map(b => b.toString(16)).join(' '));
    console.log('Password chars:', Array.from(url.password).map(c => c.charCodeAt(0)).join(' '));
    
  } catch (e) {
    console.log('❌ Failed to parse DATABASE_URL:', e.message);
  }
}

// Check PGPASSWORD
console.log('\n📊 PGPASSWORD Analysis:');
const pgPass = process.env.PGPASSWORD;
if (!pgPass) {
  console.log('❌ PGPASSWORD is NOT SET!');
} else {
  console.log('✅ PGPASSWORD is set');
  console.log('Length:', pgPass.length);
  console.log('Value:', pgPass); // Show full password for debugging
  console.log('Has trailing spaces:', pgPass !== pgPass.trim() ? 'YES ❌' : 'NO ✅');
  
  // Byte analysis
  console.log('\n🔍 PGPASSWORD byte analysis:');
  const pgPassBytes = Buffer.from(pgPass);
  console.log('Password bytes:', Array.from(pgPassBytes).map(b => b.toString(16)).join(' '));
}

// Compare passwords
if (dbUrl && pgPass) {
  try {
    const url = new URL(dbUrl);
    console.log('\n🔍 Password comparison:');
    console.log('DATABASE_URL password:', url.password);
    console.log('PGPASSWORD:', pgPass);
    console.log('Match:', url.password === pgPass ? 'YES ✅' : 'NO ❌');
  } catch (e) {
    console.log('Could not compare passwords');
  }
}

// Test actual connection
console.log('\n🔌 Testing database connection...');
import { Sequelize } from 'sequelize';

if (dbUrl) {
  const sequelize = new Sequelize(dbUrl, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false
  });

  sequelize.authenticate()
    .then(() => {
      console.log('✅ Database connection SUCCESSFUL!');
      process.exit(0);
    })
    .catch(err => {
      console.log('❌ Database connection FAILED!');
      console.log('Error message:', err.message);
      console.log('Error code:', err.original?.code);
      console.log('Error detail:', err.original?.detail);
      console.log('Full error:', JSON.stringify(err, null, 2));
      process.exit(1);
    });
} else {
  console.log('❌ Cannot test connection - DATABASE_URL not set');
  process.exit(1);
}