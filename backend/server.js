const express  = require('express');
const http     = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const dns = require('dns');

if (process.env.MONGODB_DNS_SERVERS) {
  dns.setServers(process.env.MONGODB_DNS_SERVERS.split(',').map(server => server.trim()));
}

const app    = express();
const server = http.createServer(app);
const razorpayRoutes = require('./routes/razorpay');
const io     = socketIO(server, {
  cors: { origin: process.env.CLIENT_URL, methods: ['GET','POST'] },
  maxHttpBufferSize: 10e6
});

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(morgan('dev'));
// Razorpay signs the exact raw body. This must run before express.json().
app.post('/api/razorpay/webhook', express.raw({ type: 'application/json' }), razorpayRoutes.webhookHandler);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS) || 30000 })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

require('./sockets/socketHandler')(io);
app.set('io', io);

app.use('/api/auth',          require('./routes/auth'));
app.use('/api/interns',       require('./routes/interns'));
app.use('/api/projects',      require('./routes/projects'));
app.use('/api/tasks',         require('./routes/tasks'));
app.use('/api/attendance',    require('./routes/attendance'));
app.use('/api/teams',         require('./routes/teams'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/tickets',       require('./routes/tickets'));
app.use('/api/certificates',  require('./routes/certificates'));
app.use('/api/reports',       require('./routes/reports'));
app.use('/api/dashboard',     require('./routes/dashboard'));
app.use('/api/domains',       require('./routes/domains'));
app.use('/api/razorpay',      razorpayRoutes);
app.use('/api/payments',      require('./routes/payments'));
app.use('/api/learning',      require('./routes/learning'));
app.use('/api/public',        require('./routes/publicLearning'));
app.use('/api/inquiries',     require('./routes/inquiries'));
app.use('/api/engagement',    require('./routes/engagement'));

app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Server Error' });
});

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
module.exports = { app, io, server };
