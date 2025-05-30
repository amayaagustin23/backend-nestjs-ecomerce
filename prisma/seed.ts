import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await hash('Pass1234', 10);

  await prisma.brand.createMany({
    data: [{ name: 'Nike' }, { name: 'Adidas' }, { name: 'Puma' }],
  });

  const brandList = await prisma.brand.findMany();

  await prisma.user.create({
    data: {
      email: 'admin@demo.com',
      password,
      role: 'ADMIN',
      person: {
        create: {
          name: 'Admin Demo',
          phone: faker.phone.number(),
          cuitOrDni: '20222222223',
        },
      },
    },
  });

  for (let i = 1; i <= 3; i++) {
    await prisma.user.create({
      data: {
        email: `cliente${i}@demo.com`,
        password,
        role: 'CLIENT',
        person: {
          create: {
            name: `Cliente ${i}`,
            phone: faker.phone.number(),
            cuitOrDni: faker.string.numeric(11),
          },
        },
        addresses: {
          create: [
            {
              street: faker.location.streetAddress(),
              city: 'San Miguel de Tucumán',
              province: 'Tucumán',
              postalCode: '4000',
              isDefault: true,
            },
            {
              street: faker.location.streetAddress(),
              city: 'Yerba Buena',
              province: 'Tucumán',
              postalCode: '4107',
              isDefault: false,
            },
          ],
        },
      },
    });
  }

  await prisma.category.createMany({
    data: [
      { name: 'Remeras', description: 'Ropa superior básica' },
      { name: 'Pantalones', description: 'Ropa inferior' },
      { name: 'Zapatillas', description: 'Calzado deportivo' },
    ],
  });

  const allParentCategories = await prisma.category.findMany({
    where: { parentId: null },
  });

  for (const parent of allParentCategories) {
    await prisma.category.createMany({
      data: [
        {
          name: `Sub ${parent.name} A`,
          description: `Primera subcategoría de ${parent.name}`,
          parentId: parent.id,
        },
        {
          name: `Sub ${parent.name} B`,
          description: `Segunda subcategoría de ${parent.name}`,
          parentId: parent.id,
        },
      ],
    });
  }

  const categories = await prisma.category.findMany();

  const sizes = ['M', 'L', 'XL'];
  const colors = ['Negro'];

  for (let i = 1; i <= 15; i++) {
    const category = categories[i % categories.length];
    const brand = brandList[i % brandList.length];

    const product = await prisma.product.create({
      data: {
        name: `${category.name} Producto ${i}`,
        description: faker.commerce.productDescription(),
        price: parseFloat(faker.commerce.price({ min: 5000, max: 20000 })),
        isService: false,
        isActive: true,
        hasDelivery: true,
        categoryId: category.id,
        brandId: brand.id,
        images: {
          create: [
            {
              url: `https://via.placeholder.com/500x500.png?text=${encodeURIComponent(category.name)}+${i}`,
              description: `Imagen del producto ${i}`,
              order: 1,
            },
          ],
        },
      },
    });

    for (const size of sizes) {
      for (const color of colors) {
        await prisma.productVariant.create({
          data: {
            size,
            color,
            stock: faker.number.int({ min: 0, max: 30 }),
            productId: product.id,
          },
        });
      }
    }
  }

  console.log(
    '✅ Seed generado con marcas, usuarios, direcciones, categorías y productos con variantes.',
  );
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
