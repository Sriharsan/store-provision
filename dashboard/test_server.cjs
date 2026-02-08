const http = require('http');

const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Hello World');
});

const port = 8082;
const host = '127.0.0.1';

server.listen(port, host, () => {
    console.log(`Server running at http://${host}:${port}/`);
});
