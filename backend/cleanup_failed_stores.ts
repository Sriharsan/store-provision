
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Cleaning up FAILED stores...');
    const result = await prisma.store.deleteMany({
        where: {
            status: 'FAILED',
        },
    });
    console.log(`Deleted ${result.count} FAILED stores.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
