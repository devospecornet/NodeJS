// logger.js
const fs = require('fs');
const path = require('path');
const eventBus = require('./eventBus');

const logFilePath = path.join(__dirname, 'data', 'logs.txt');

function writeLog(message) {
    const now = new Date().toISOString();
    const logLine = `[${now}] ${message}\n`;
    fs.appendFile(logFilePath, logLine, (err) => {
        if (err) {
            console.error('Erreur écriture log:', err);
        }
    });
}

// ICI : écoute d’un événement personnalisé ↓
eventBus.on('custom:message', (message) => {
    console.log('LOG EVENT:', message);
    writeLog(`custom:message - ${message}`);
});

eventBus.on('server:start', ({ port }) => {
    console.log(`LOG EVENT: server:start (port ${port})`);
    writeLog(`server:start - port ${port}`);
});

eventBus.on('auth:attempt', ({ email, ip }) => {
    writeLog(`auth:attempt - ${email} - ${ip}`);
});
eventBus.on('auth:success', ({ email, ip }) => {
    writeLog(`auth:success - ${email} - ${ip}`);
});
eventBus.on('auth:failure', ({ email, ip, attempts }) => {
    writeLog(`auth:failure - ${email} - ${ip} - attempt ${attempts}`);
});
eventBus.on('auth:locked', ({ email, ip, attempts, maxAttempts }) => {
    writeLog(`auth:locked - ${email} - ${ip} - ${attempts}/${maxAttempts} failed attempts`);
});
eventBus.on('auth:blocked', ({ email, ip, attempts }) => {
    writeLog(`auth:blocked - ${email} - ${ip} - ${attempts} failed attempts`);
});
eventBus.on('action:triggered', ({ action, ip }) => {
    // Optionnel (pour plus de visibilité console) :
    console.log(`ACTION ${action} déclenchée depuis ${ip}`);
    writeLog(`action:triggered - action ${action} - ${ip}`);
});
