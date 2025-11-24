#!/usr/bin/env node
/**
 * Ultra-lightweight ping script for Replit keep-alive
 * Runs independently, pings the server every 3 minutes
 * Auto-restarts on crash via loop
 */

const PORT = process.env.PORT || 5000;
const PING_INTERVAL = 3 * 60 * 1000; // 3 minutes
const PING_URL = `http://localhost:${PORT}/ping`;

let pingCount = 0;

async function doPing() {
  pingCount++;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(PING_URL, { 
      signal: controller.signal,
      method: 'GET'
    });
    clearTimeout(timeout);
    
    const now = new Date().toISOString().split('T')[1].split('.')[0];
    if (response.ok) {
      console.log(`[${now}] ✓ Ping #${pingCount} OK`);
    } else {
      console.log(`[${now}] ✗ Ping #${pingCount} failed (${response.status})`);
    }
  } catch (err) {
    const now = new Date().toISOString().split('T')[1].split('.')[0];
    console.log(`[${now}] ✗ Ping #${pingCount} error: ${err.message}`);
  }
}

async function startPingLoop() {
  console.log(`[PING] Starting keep-alive loop (every ${PING_INTERVAL / 1000}s to ${PING_URL})`);
  
  // Initial ping
  await doPing();
  
  // Then repeat every 3 minutes
  setInterval(doPing, PING_INTERVAL);
}

// Start immediately
startPingLoop();

// Graceful exit handling
process.on('SIGINT', () => {
  console.log('\n[PING] Shutting down gracefully');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[PING] Shutting down gracefully');
  process.exit(0);
});
