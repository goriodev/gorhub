import { PrismaClient, Role, ProductStatus, OrderStatus, TaskStatus, Priority, ProjectStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  const password = await bcrypt.hash('Demo1234!', 12)

  const user = await prisma.user.upsert({
    where: { email: 'demo@gorhub.com' },
    update: {},
    create: {
      name: 'Demo User',
      email: 'demo@gorhub.com',
      password,
      role: Role.ADMIN,
    },
  })

  // Products
  const products = await Promise.all([
    prisma.product.create({ data: { name: 'Wireless Headphones', price: 149.99, stock: 42, sku: 'WH-001', category: 'Electronics', status: ProductStatus.ACTIVE, userId: user.id } }),
    prisma.product.create({ data: { name: 'Mechanical Keyboard', price: 89.99, stock: 18, sku: 'KB-002', category: 'Electronics', status: ProductStatus.ACTIVE, userId: user.id } }),
    prisma.product.create({ data: { name: 'USB-C Hub', price: 39.99, stock: 0, sku: 'HB-003', category: 'Accessories', status: ProductStatus.OUT_OF_STOCK, userId: user.id } }),
    prisma.product.create({ data: { name: 'Desk Lamp', price: 59.99, stock: 25, sku: 'DL-004', category: 'Office', status: ProductStatus.ACTIVE, userId: user.id } }),
    prisma.product.create({ data: { name: 'Webcam 4K', price: 199.99, stock: 7, sku: 'WC-005', category: 'Electronics', status: ProductStatus.ACTIVE, userId: user.id } }),
  ])

  // Orders
  await prisma.order.create({
    data: {
      orderNumber: 'ORD-2024-001',
      status: OrderStatus.DELIVERED,
      total: 239.98,
      userId: user.id,
      items: { create: [{ quantity: 1, unitPrice: 149.99, productId: products[0].id }, { quantity: 1, unitPrice: 89.99, productId: products[1].id }] },
    },
  })
  await prisma.order.create({
    data: {
      orderNumber: 'ORD-2024-002',
      status: OrderStatus.PROCESSING,
      total: 259.98,
      userId: user.id,
      items: { create: [{ quantity: 1, unitPrice: 59.99, productId: products[3].id }, { quantity: 1, unitPrice: 199.99, productId: products[4].id }] },
    },
  })
  await prisma.order.create({
    data: {
      orderNumber: 'ORD-2024-003',
      status: OrderStatus.PENDING,
      total: 39.99,
      userId: user.id,
      items: { create: [{ quantity: 1, unitPrice: 39.99, productId: products[2].id }] },
    },
  })

  // Project + Tasks
  const project = await prisma.project.create({
    data: {
      name: 'Q1 Product Launch',
      description: 'Prepare and execute the Q1 product launch campaign',
      color: '#4f6ef7',
      status: ProjectStatus.ACTIVE,
      userId: user.id,
    },
  })

  await Promise.all([
    prisma.task.create({ data: { title: 'Design landing page mockups', status: TaskStatus.DONE, priority: Priority.HIGH, userId: user.id, projectId: project.id } }),
    prisma.task.create({ data: { title: 'Write product descriptions', status: TaskStatus.IN_PROGRESS, priority: Priority.MEDIUM, userId: user.id, projectId: project.id } }),
    prisma.task.create({ data: { title: 'Set up email campaign', status: TaskStatus.IN_REVIEW, priority: Priority.HIGH, userId: user.id, projectId: project.id } }),
    prisma.task.create({ data: { title: 'Configure payment gateway', status: TaskStatus.TODO, priority: Priority.URGENT, userId: user.id, projectId: project.id } }),
    prisma.task.create({ data: { title: 'QA testing on staging', status: TaskStatus.TODO, priority: Priority.MEDIUM, userId: user.id, projectId: project.id } }),
  ])

  console.log('✅ Seed complete! Login: demo@gorhub.com / Demo1234!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
