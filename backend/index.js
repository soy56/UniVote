// Compatibility entrypoint for hosting platforms
// This file simply requires the actual server entry at ./auth/server.js
// so that services which expect a root-level start script can run the API.
try {
  require('./auth/server');
} catch (err) {
  // Log to stderr so platform logs capture the error
  // eslint-disable-next-line no-console
  console.error('Failed to start auth server from index.js', err && err.stack ? err.stack : err);
  process.exit(1);
}
