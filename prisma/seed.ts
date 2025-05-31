import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await hash('Pass1234', 10);

  // Crear marcas
  await prisma.brand.createMany({
    data: [{ name: 'Nike' }, { name: 'Adidas' }, { name: 'Puma' }],
  });

  const brandList = await prisma.brand.findMany();

  // Crear categorías padre
  await prisma.category.createMany({
    data: [
      { name: 'Remeras', description: 'Ropa superior básica' },
      { name: 'Pantalones', description: 'Ropa inferior' },
      { name: 'Zapatillas', description: 'Calzado deportivo' },
    ],
  });

  // Crear subcategorías
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

  // Crear productos y variantes
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
              url: `https://via.placeholder.com/500x500.png?text=${encodeURIComponent(
                category.name,
              )}+${i}`,
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

  // Crear cupones
  const allCoupons = [];

  for (let i = 1; i <= 5; i++) {
    const coupon = await prisma.coupon.create({
      data: {
        description: `Cupón global ${i}`,
        value: faker.number.int({ min: 5, max: 50 }),
        price: faker.number.int({ min: 50, max: 300 }),
        code: `CUPON${i}`,
        status: 'ACTIVE',
        expiresAt: faker.date.soon({ days: 30 }),
      },
    });

    allCoupons.push(coupon);
  }

  // Crear usuarios clientes y asociar cupones
  for (let i = 1; i <= 3; i++) {
    const user = await prisma.user.create({
      data: {
        email: `amaayaagustin.2395+${i}@gmail.com`,
        password,
        role: 'CLIENT',
        points: faker.number.int({ min: 300, max: 500 }),
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
          ],
        },
      },
    });

    // Asignar entre 1 y 3 cupones aleatorios a cada usuario
    const couponCount = faker.number.int({ min: 1, max: 3 });
    const randomCoupons = faker.helpers.arrayElements(allCoupons, couponCount);

    for (const coupon of randomCoupons) {
      await prisma.userCoupon.create({
        data: {
          userId: user.id,
          couponId: coupon.id,
        },
      });
    }
  }

  console.log(
    '🎉 Seed completado con relación muchos a muchos entre usuarios y cupones.',
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
