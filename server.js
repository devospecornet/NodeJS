// server.js
const http = require('http');
const eventBus = require('./eventBus');
const auth = require('./auth');
const fs = require('fs');
const path = require('path');

function serveFile(res, filePath, contentType = 'text/html') {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Erreur serveur');
            return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
}

function redirect(res, location) {
    res.writeHead(302, { Location: location });
    res.end();
}

function loadUsers() {
    const usersPath = path.join(__dirname, 'config', 'users.json');
    const fileContent = fs.readFileSync(usersPath, 'utf-8');
    return JSON.parse(fileContent);
}

function isValidLogin(email, password, users) {
    return users.some((u) => u.email === email && u.password === password);
}


const server = http.createServer((req, res) => {
    // Ce code est exécuté à CHAQUE requête HTTP
    console.log('Nouvelle requête reçue');
    console.log('URL:', req.url);
    console.log('Méthode:', req.method);

    if (req.method === 'GET' && req.url === '/logs') {
        const logPath = path.join(__dirname, 'data', 'logs.txt');
        fs.readFile(logPath, 'utf-8', (err, content) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Impossible de lire le fichier de logs');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end(content);
        });
        return;
    }

        if (req.method === 'GET' && req.url === '/action/a') {
            const ip = req.socket.remoteAddress;
            eventBus.emit('action:triggered', {
                action: 'A',
                ip
            });
            redirect(res, '/dashboard');
            return;
        }

        if (req.method === 'GET' && req.url === '/action/b') {
            const ip = req.socket.remoteAddress;
            eventBus.emit('action:triggered', {
                action: 'B',
                ip
            });
            redirect(res, '/dashboard');
            return;
        }

        if (req.method === 'GET' && req.url === '/action/c') {
            const ip = req.socket.remoteAddress;
            eventBus.emit('action:triggered', {
                action: 'C',
                ip
            });
            redirect(res, '/dashboard');
            return;
        }


        if (req.method === 'POST' && req.url === '/login') {
            let body = '';
            req.on('data', (chunk) => {
                body += chunk.toString();
            });

            req.on('error', (err) => {
                // Événement custom pour signaler une erreur technique
                eventBus.emit('request:error', { message: err.message });
                // Réponse HTTP côté client
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('Erreur lors de la réception des données');
            });


            req.on('end', () => {
                const params = new URLSearchParams(body);
                const email = params.get('email');
                const password = params.get('password');
                const ip = req.socket.remoteAddress === '::1'
                    ? '127.0.0.1'
                    : req.socket.remoteAddress.replace(/^::ffff:/, '');
                // Tentative de connexion
                eventBus.emit('auth:attempt', { email, ip });

                if (auth.isBlocked(email)) {
                    eventBus.emit('auth:blocked', {
                        email,
                        ip,
                        attempts: auth.getFailedAttempts(email)
                    });
                    redirect(res, '/login?locked=1');
                    return;
                }

                const users = loadUsers();
                if (isValidLogin(email, password, users)) {
                    auth.resetFailedAttempts(email);
                    eventBus.emit('auth:success', { email, ip });
                    redirect(res, '/dashboard');
                } else {
                    const attempts = auth.recordFailedAttempt(email);
                    eventBus.emit('auth:failure', { email, ip, attempts });

                    if (auth.isBlocked(email)) {
                        eventBus.emit('auth:locked', {
                            email,
                            ip,
                            attempts,
                            maxAttempts: auth.MAX_FAILED_ATTEMPTS
                        });
                        redirect(res, '/login?locked=1');
                    } else {
                        redirect(res, `/login?error=1&attempts=${attempts}`);
                    }
                }
                //res.end(`email=${email} | password=${password} | ip=${ip}`);

            });
            return;

        }

        if (req.method === 'GET' && new URL(req.url, 'http://localhost').pathname === '/login') {
            const filePath = path.join(__dirname, 'public', 'login.html');
            serveFile(res, filePath);
            return;
        } else if (req.method === 'GET' && req.url === '/dashboard') {
            const filePath = path.join(__dirname, 'public', 'dashboard.html');
            serveFile(res, filePath);
            return;
        } else if (req.url === '/') {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end('<h1>Accueil</h1>');
        } else if (req.url === '/about') {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end('<h1>À propos</h1>');
        } else {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>Page non trouvée</h1>');
        }
    });

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
    // Le serveur démarre… c’est aussi un événement !
    eventBus.emit('server:start', { port: PORT });
});


module.exports = server;