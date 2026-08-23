const http = require('http');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    const clientIp = req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    // Simulate backend response
    const payload = {
        status: "success",
        message: "Request successfully processed by upstream backend server.",
        received_at: new Date().toISOString(),
        method: req.method,
        url: req.url,
        client_ip: clientIp,
        headers_forwarded: {
            "x-real-ip": req.headers['x-real-ip'],
            "x-forwarded-for": req.headers['x-forwarded-for'],
            "user-agent": req.headers['user-agent']
        }
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload, null, 2));
});

server.listen(PORT, () => {
    console.log(`[Backend Mock Server] Listening on port ${PORT}`);
});
