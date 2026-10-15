const dns = require('dns');
const net = require('net');
const mongoose = require('mongoose');
require('dotenv').config();

// Apply custom DNS servers if configured in server.js
if (process.env.MONGODB_DNS_SERVERS) {
  const servers = process.env.MONGODB_DNS_SERVERS.split(',').map(s => s.trim());
  console.log(`ℹ️ Setting Node.js DNS servers to: ${servers.join(', ')}`);
  try {
    dns.setServers(servers);
  } catch (err) {
    console.error(`⚠️ Failed to set DNS servers: ${err.message}`);
  }
}

async function runDiagnostics() {
  console.log('========================================');
  console.log('MONGODB CONNECTION DIAGNOSTICS');
  console.log('========================================\n');

  // CHECK 1: ENVIRONMENT
  console.log('--- CHECK 1: ENVIRONMENT ---');
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('❌ MONGO_URI is missing from environment configuration.');
    process.exit(1);
  }
  console.log('✅ MONGO_URI environment variable detected.');

  // CHECK 2: URI FORMAT
  console.log('\n--- CHECK 2: URI FORMAT ---');
  const match = uri.match(/^(mongodb(?:\+srv)?:\/\/)(?:([^:]+):([^@]+)@)?([^/?#]+)/);
  if (!match) {
    console.error('❌ MONGO_URI format is invalid. Could not parse.');
    process.exit(1);
  }
  const [_, protocol, username, password, hosts] = match;
  const isSrv = protocol === 'mongodb+srv://';
  console.log(`✅ URI protocol detected: ${protocol}`);
  if (username) {
    console.log('✅ Username: [PRESENT] (hidden for security)');
  } else {
    console.warn('⚠️ Username: [NOT FOUND]');
  }
  if (password) {
    console.log('✅ Password: [PRESENT] (hidden for security)');
    // Check if password has characters that need encoding
    const decodedPassword = decodeURIComponent(password);
    if (decodedPassword !== password) {
      console.warn('⚠️ Warning: Password contains characters that were automatically decoded differently. Ensure special characters are URI encoded.');
    }
  } else {
    console.warn('⚠️ Password: [NOT FOUND]');
  }

  // CHECK 3: EXTRACT HOST SAFELY
  console.log('\n--- CHECK 3: EXTRACT HOST SAFELY ---');
  console.log(`✅ Cluster host(s): ${hosts}`);

  // CHECK 4: SRV DNS
  console.log('\n--- CHECK 4: SRV DNS ---');
  let targetHosts = [];
  if (isSrv) {
    try {
      console.log(`Resolving SRV records for _mongodb._tcp.${hosts}...`);
      const srvRecords = await dns.promises.resolveSrv(`_mongodb._tcp.${hosts}`);
      console.log('✅ SRV DNS resolution successful.');
      targetHosts = srvRecords.map(r => ({ host: r.name, port: r.port }));
      targetHosts.forEach((r, i) => {
        console.log(`  Node ${i + 1}: ${r.host}:${r.port}`);
      });
    } catch (err) {
      console.error(`❌ SRV DNS resolution failed: ${err.code} (${err.message})`);
      console.error(`Please check if your DNS server can resolve the MongoDB Atlas SRV record.`);
      console.error(`Try running: nslookup -type=SRV _mongodb._tcp.${hosts}`);
      return;
    }
  } else {
    console.log('ℹ️ Non-SRV connection URI. Parsing host list...');
    targetHosts = hosts.split(',').map(h => {
      const parts = h.split(':');
      return { host: parts[0], port: parseInt(parts[1] || '27017', 10) };
    });
    targetHosts.forEach((r, i) => {
      console.log(`  Node ${i + 1}: ${r.host}:${r.port}`);
    });
  }

  // CHECK 5: DNS A/AAAA
  console.log('\n--- CHECK 5: DNS A/AAAA RESOLUTION ---');
  let dnsFailure = false;
  for (const target of targetHosts) {
    try {
      const addresses = await dns.promises.resolve(target.host);
      console.log(`✅ Resolved ${target.host} to: ${addresses.join(', ')}`);
    } catch (err) {
      console.error(`❌ Failed to resolve ${target.host}: ${err.code} (${err.message})`);
      dnsFailure = true;
    }
  }
  if (dnsFailure) {
    console.error('❌ One or more hostnames failed to resolve via DNS.');
  } else {
    console.log('✅ All Atlas hostnames resolved successfully.');
  }

  // CHECK 6: TCP CONNECTIVITY
  console.log('\n--- CHECK 6: TCP CONNECTIVITY (Port 27017) ---');
  let tcpSuccessCount = 0;
  for (const target of targetHosts) {
    const start = Date.now();
    try {
      await new Promise((resolve, reject) => {
        const socket = new net.Socket();
        const timer = setTimeout(() => {
          socket.destroy();
          reject(new Error('Connection timeout (5s)'));
        }, 5000);

        socket.connect(target.port, target.host, () => {
          clearTimeout(timer);
          socket.end();
          resolve();
        });

        socket.on('error', (err) => {
          clearTimeout(timer);
          reject(err);
        });
      });
      console.log(`✅ TCP port ${target.port} reachable on ${target.host} in ${Date.now() - start}ms`);
      tcpSuccessCount++;
    } catch (err) {
      console.error(`❌ TCP port ${target.port} unreachable on ${target.host}: ${err.message}`);
    }
  }

  if (tcpSuccessCount === 0) {
    console.error('\n❌ ALL TCP connection attempts to Atlas nodes failed!');
    console.error('Possible causes:');
    console.error('1. MongoDB Atlas Network Access IP Access List is blocking this PC.');
    console.error('2. Local firewall, VPN, proxy, or ISP is blocking outbound connections on port 27017.');
  } else if (tcpSuccessCount < targetHosts.length) {
    console.warn(`\n⚠️ Only ${tcpSuccessCount}/${targetHosts.length} nodes are reachable. Some replica set members are unreachable.`);
  } else {
    console.log('\n✅ All replica set nodes are TCP reachable on port 27017.');
  }

  // CHECK 7: MONGOOSE CONNECTION
  console.log('\n--- CHECK 7: MONGOOSE CONNECTION TEST ---');
  console.log('Connecting with mongoose...');
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Mongoose connected successfully.');
    await mongoose.disconnect();
    console.log('✅ Mongoose disconnected successfully.');
  } catch (err) {
    console.error('❌ Mongoose connection failed.');
    let category = 'Unknown/Other Error';
    if (err.name === 'MongooseServerSelectionError') {
      if (err.message.includes('Could not connect to any servers')) {
        category = 'Network access blocked or Atlas IP access list missing';
      } else {
        category = 'Server selection timeout';
      }
    } else if (err.message.includes('Authentication failed') || err.message.includes('auth failed')) {
      category = 'Authentication failed (incorrect username or password)';
    } else if (err.code === 'ENOTFOUND' || err.message.includes('ENOTFOUND')) {
      category = 'DNS resolution failed';
    } else if (err.message.includes('TLS') || err.message.includes('certificate')) {
      category = 'TLS connection or certificate failure';
    }
    console.error(`Error Category: ${category}`);
    console.error(`Error details: ${err.name}: ${err.message}`);
  }
  console.log('\n========================================');
  console.log('DIAGNOSTICS COMPLETED');
  console.log('========================================');
}

runDiagnostics().catch(err => {
  console.error('Diagnostic runner failed:', err);
});
