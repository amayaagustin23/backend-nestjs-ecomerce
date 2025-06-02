import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await hash('Pass1234', 10);

  await prisma.brand.createMany({
    data: [
      { name: 'Sony' },
      { name: 'Samsung' },
      { name: 'LG' },
      { name: 'Xiaomi' },
      { name: 'Nike' },
      { name: 'JBL' },
    ],
  });

  const brands = await prisma.brand.findMany();

  await prisma.category.createMany({
    data: [
      { name: 'Moda', description: 'Ropa y accesorios de vestir' },
      { name: 'Tecnologia', description: 'Tecnología y gadgets' },
      { name: 'Hogar', description: 'Artículos para el hogar' },
    ],
  });

  const parentList = await prisma.category.findMany({
    where: { parentId: null },
  });

  const subData = {
    Moda: ['Remeras', 'Pantalones', 'Zapatos'],
    Tecnologia: ['Celulares', 'Auriculares', 'Smart TV'],
    Hogar: ['Muebles', 'Cocina', 'Decoración'],
  };

  for (const parent of parentList) {
    await prisma.category.createMany({
      data: subData[parent.name].map((sub) => ({
        name: sub,
        description: `Subcategoría de ${parent.name}: ${sub}`,
        parentId: parent.id,
      })),
    });
  }

  const allCategories = await prisma.category.findMany();
  const moda = {
    names: [
      'Remera Oversize Negra',
      'Camisa de Lino Blanca Hombre',
      'Camiseta Técnica Running Mujer',
      'Jean Slim Azul Oscuro',
      'Jogger Urbano Unisex',
      'Zapatillas Urbanas Negras',
      'Zapatos de Cuero Marrón',
    ],
    categories: allCategories.filter((c) =>
      ['Remeras', 'Pantalones', 'Zapatos'].includes(c.name),
    ),
    variantType: 'size',
  };

  const electro = {
    names: [
      'Smartphone Samsung Galaxy A34',
      'Auriculares Bluetooth JBL Tune 510BT',
      'Smart TV LG 50" 4K UHD',
      'Tablet Lenovo M10 HD',
      'Parlante Bluetooth Sony SRS-XB13',
      'Mouse Inalámbrico Logitech M185',
      'Notebook HP 14” Ryzen 5',
    ],
    categories: allCategories.filter((c) =>
      ['Celulares', 'Auriculares', 'Smart TV'].includes(c.name),
    ),
    variantType: 'color',
  };

  const hogar = {
    names: [
      'Silla Eames Reforzada',
      'Mesa Ratona Minimalista',
      'Set de Ollas Tramontina',
      'Lámpara de Pie de Madera',
      'Ropa de Cama 2 Plazas',
      'Estantería Metálica 5 Niveles',
      'Dispensador de Agua Eléctrico',
    ],
    categories: allCategories.filter((c) =>
      ['Muebles', 'Cocina', 'Decoración'].includes(c.name),
    ),
    variantType: 'color',
  };

  const sizes = ['S', 'M', 'L', 'XL'];
  const colors = ['Negro', 'Blanco', 'Gris'];

  const createProducts = async (
    data: typeof moda | typeof electro | typeof hogar,
  ) => {
    for (const name of data.names) {
      const category = faker.helpers.arrayElement(data.categories);
      const brand = faker.helpers.arrayElement(brands);

      const product = await prisma.product.create({
        data: {
          name,
          description: faker.commerce.productDescription(),
          price: parseFloat(faker.commerce.price({ min: 100, max: 1000 })),
          isService: data.variantType === 'none',
          isActive: true,
          hasDelivery: data.variantType !== 'none',
          categoryId: category.id,
          brandId: brand.id,
          images: {
            create: [
              {
                url: `https://via.placeholder.com/500x500.png?text=${encodeURIComponent(
                  name,
                )}`,
                description: `Imagen de ${name}`,
                order: 1,
              },
            ],
          },
        },
      });

      if (data.variantType === 'size') {
        for (const size of sizes) {
          await prisma.productVariant.create({
            data: {
              size,
              color: 'Único',
              stock: faker.number.int({ min: 0, max: 20 }),
              productId: product.id,
            },
          });
        }
      } else if (data.variantType === 'color') {
        for (const color of colors) {
          await prisma.productVariant.create({
            data: {
              color,
              size: 'Único',
              stock: faker.number.int({ min: 0, max: 20 }),
              productId: product.id,
            },
          });
        }
      }
    }
  };

  await createProducts(moda);
  await createProducts(electro);
  await createProducts(hogar);

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

  for (let i = 1; i <= 2; i++) {
    await prisma.coupon.create({
      data: {
        description: `Cupón Promoción ${i}`,
        value: faker.number.int({ min: 10, max: 60 }),
        price: faker.number.int({ min: 80, max: 400 }),
        code: `PROMO${i}`,
        status: 'ACTIVE',
        type: 'PROMOTION',
        expiresAt: faker.date.soon({ days: 60 }),
      },
    });
  }

  for (let i = 1; i <= 3; i++) {
    const user = await prisma.user.create({
      data: {
        email: `amayaagustin.2395+${i}@gmail.com`,
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

    const userCoupons = faker.helpers.arrayElements(
      allCoupons,
      faker.number.int({ min: 1, max: 3 }),
    );
    for (const coupon of userCoupons) {
      await prisma.userCoupon.create({
        data: {
          userId: user.id,
          couponId: coupon.id,
        },
      });
    }
  }

  console.log('✅ Seed generado con nombres reales y variantes por categoría.');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
