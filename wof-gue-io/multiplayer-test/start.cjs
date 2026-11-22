// Standalone guest-only service. No account or save connection.
process.env.DEMO_CLIENT_BUNDLE = require('node:path').join(__dirname, 'dist/client.js');
require('./dist/server.cjs');
