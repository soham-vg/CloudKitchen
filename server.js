const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const COUNT_FILE = path.join(__dirname, 'visitor_count.txt');

// Initialize the count file if it doesn't exist
if (!fs.existsSync(COUNT_FILE)) {
    fs.writeFileSync(COUNT_FILE, '1234', 'utf8');
}

const server = http.createServer((req, res) => {
    // 1. Visitor API
    if (req.url === '/api/visitors' && req.method === 'GET') {
        fs.readFile(COUNT_FILE, 'utf8', (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: 'Failed to read visitor count' }));
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ count: parseInt(data.trim(), 10) || 1234 }));
        });
        return;
    }

    if (req.url === '/api/visitors' && req.method === 'POST') {
        // Read, increment, write
        fs.readFile(COUNT_FILE, 'utf8', (err, data) => {
            let count = 1234;
            if (!err) {
                count = parseInt(data.trim(), 10) || 1234;
            }
            count++;
            fs.writeFile(COUNT_FILE, count.toString(), 'utf8', (writeErr) => {
                if (writeErr) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: 'Failed to write visitor count' }));
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ count }));
            });
        });
        return;
    }

    // 2. Static File Serving
    // Sanitize the URL to prevent directory traversal
    let safeUrl = req.url.split('?')[0]; // Strip query parameters
    let safeSuffix = path.normalize(safeUrl).replace(/^(\.\.[\/\\])+/, '');
    if (safeSuffix === '/' || safeSuffix === '\\') {
        safeSuffix = 'index.html';
    }
    
    let filePath = path.join(__dirname, safeSuffix);

    // Basic MIME types
    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.ico': 'image/x-icon',
        '.svg': 'image/svg+xml'
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 File Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end(`Sorry, check with the site admin for error: ${error.code} ..\n`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
