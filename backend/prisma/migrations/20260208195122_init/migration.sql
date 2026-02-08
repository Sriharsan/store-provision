-- CreateTable
CREATE TABLE "stores" (
    "id" TEXT NOT NULL,
    "engine" TEXT NOT NULL DEFAULT 'medusa',
    "template" TEXT NOT NULL DEFAULT 'starter',
    "status" TEXT NOT NULL,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "errorMessage" TEXT,
    "cpu" TEXT NOT NULL DEFAULT '500m',
    "memory" TEXT NOT NULL DEFAULT '512Mi',
    "storage" TEXT NOT NULL DEFAULT '5Gi',

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_events" (
    "id" SERIAL NOT NULL,
    "storeId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "store_events_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "store_events" ADD CONSTRAINT "store_events_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
