import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query"] : [],
    });
  }
  return globalForPrisma.prisma;
}

// Proxy: PrismaClient cuma dibuat saat benar-benar dipanggil
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    return (getPrisma() as any)[prop];
  },
});
