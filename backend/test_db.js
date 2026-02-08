
const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:5433/store_provisioning?schema=public',
});

async function main() {
    try {
        console.log('Connecting...');
        await client.connect();
        console.log('Connected successfully!');
        await client.end();
    } catch (err) {
        console.error('Connection failed:', err.message);
        console.error('Code:', err.code);
        process.exit(1);
    }
}

main();
