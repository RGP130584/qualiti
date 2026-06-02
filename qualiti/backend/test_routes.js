const fastify = require('fastify');
const path = require('path');
require('ts-node').register();

async function run() {
  const { default: server } = await import('./src/index.ts');
  console.log("Mock script finished");
}
run().catch(console.error);
