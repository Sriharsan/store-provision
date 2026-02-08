
const net = require('net');

const client = new net.Socket();
const port = 5433;
const host = '127.0.0.1';

console.log(`Testing TCP connection to ${host}:${port}...`);

client.connect(port, host, function () {
    console.log('Connected successfully!');
    client.destroy();
});

client.on('error', function (err) {
    console.error('Connection failed:', err.message);
    process.exit(1);
});

client.setTimeout(5000, () => {
    console.error('Connection timed out');
    client.destroy();
    process.exit(1);
});
