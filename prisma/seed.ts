import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Clean up existing data
  await prisma.packageLog.deleteMany()
  await prisma.package.deleteMany()
  await prisma.cell.deleteMany()
  await prisma.client.deleteMany()
  await prisma.store.deleteMany()

  // Create stores
  const moscowStore = await prisma.store.create({
    data: { name: 'Покебарн Москва' },
  })

  const spbStore = await prisma.store.create({
    data: { name: 'Покебарн СПб' },
  })

  // Create cells for Moscow (1-10)
  for (let i = 1; i <= 10; i++) {
    await prisma.cell.create({
      data: {
        number: i,
        storeId: moscowStore.id,
      },
    })
  }

  // Create cells for SPb (1-5)
  for (let i = 1; i <= 5; i++) {
    await prisma.cell.create({
      data: {
        number: i,
        storeId: spbStore.id,
      },
    })
  }

  // Create clients
  const client1 = await prisma.client.create({
    data: {
      name: 'Иван Петров',
      phone: '9123456789',
    },
  })

  const client2 = await prisma.client.create({
    data: {
      name: 'Мария Сидорова',
      phone: '9234567890',
    },
  })

  const client3 = await prisma.client.create({
    data: {
      name: 'Александр Иванов',
      phone: '9345678901',
    },
  })

  const client4 = await prisma.client.create({
    data: {
      name: 'Елена Смирнова',
      phone: '9456789012',
    },
  })

  // Get cells for assignment
  const moscowCells = await prisma.cell.findMany({
    where: { storeId: moscowStore.id },
  })

  // Create test packages
  // Package 1: STORED
  const pkg1 = await prisma.package.create({
    data: {
      description: 'Коллекция карт Pokemon TCG',
      receiverId: client1.id,
      senderId: client2.id,
      storeId: moscowStore.id,
      cellId: moscowCells[0].id,
      status: 'STORED',
      logs: {
        create: {
          action: 'RECEIVED',
        },
      },
    },
  })

  // Package 2: IN_TRANSIT
  const pkg2 = await prisma.package.create({
    data: {
      description: 'Бустер Scarlet & Violet',
      receiverId: client3.id,
      senderId: client1.id,
      storeId: moscowStore.id,
      status: 'IN_TRANSIT',
      logs: {
        create: {
          action: 'TRANSIT_STARTED',
          note: `Moving to store ${spbStore.id}`,
        },
      },
    },
  })

  // Package 3: ISSUED
  const pkg3 = await prisma.package.create({
    data: {
      description: 'Редкие карты из коллекции',
      receiverId: client4.id,
      senderId: client3.id,
      storeId: moscowStore.id,
      cellId: null,
      status: 'ISSUED',
      pickedUpById: client4.id,
      logs: {
        create: [
          {
            action: 'RECEIVED',
          },
          {
            action: 'ISSUED',
          },
        ],
      },
    },
  })

  console.log('Database seeded successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
