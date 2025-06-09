import { faker } from '@faker-js/faker';
import {
  EcommerceType,
  ImageType,
  IndustryType,
  PrismaClient,
} from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

const PRODUCT_NAMES = [
  'Zapatillas Running',
  'Camiseta Técnica',
  'Short Deportivo',
  'Campera Impermeable',
  'Gorra Deportiva',
  'Mochila Deportiva',
  'Botella Térmica',
  'Medias Antideslizantes',
  'Calzas Fitness',
  'Top Deportivo',
  'Buzo Training',
  'Pantalón Jogger',
  'Zapatillas Trail',
  'Muñequeras',
  'Cinturón de Hidratación',
  'Lentes Deportivos',
  'Guantes de Gimnasio',
  'Banda Elástica',
  'Pelota de Yoga',
  'Esterilla de Yoga',
  'Tobilleras',
  'Riñonera Running',
  'Chaqueta Rompeviento',
  'Camiseta sin Mangas',
  'Pantalón Corto',
  'Camisa Outdoor',
  'Remera Fitness',
  'Pulsera Deportiva',
  'Camiseta de Compresión',
  'Calzado Indoor',
  'Bolso Deportivo',
  'Buzo Outdoor',
];

async function main() {
  const password = await hash('Pass1234', 10);

  const ecommerceConfig = await prisma.ecommerceConfig.create({
    data: {
      type: EcommerceType.PRODUCTOS,
      industry: IndustryType.ROPA,
      address: {
        create: {
          street: 'Av. Siempre Viva 742',
          city: 'San Miguel de Tucumán',
          province: 'Tucumán',
          postalCode: '4000',
          isDefault: true,
          lat: -26.8241,
          lng: -65.2226,
        },
      },
    },
  });

  await prisma.image.create({
    data: {
      url: 'https://placehold.co/600x400?text=Ecommerce+Config',
      description: 'Imagen principal del e-commerce',
      order: 0,
      type: ImageType.CONFIG,
      configId: ecommerceConfig.id,
    },
  });

  for (let i = 1; i <= 3; i++) {
    const banner = await prisma.ecommerceBanner.create({
      data: {
        title: `Banner ${i}`,
        subtitle: 'Subtítulo del banner',
        link: '/',
        configId: ecommerceConfig.id,
      },
    });

    await prisma.image.create({
      data: {
        url: `https://placehold.co/1200x400?text=Banner+${i}`,
        description: `Imagen del banner ${i}`,
        order: i - 1,
        type: ImageType.BANNER,
        bannerId: banner.id,
      },
    });
  }

  const [nike, adidas, puma] = await Promise.all([
    prisma.brand.create({ data: { name: 'Nike' } }),
    prisma.brand.create({ data: { name: 'Adidas' } }),
    prisma.brand.create({ data: { name: 'Puma' } }),
  ]);

  await Promise.all(
    [nike, adidas, puma].map((brand) =>
      prisma.image.create({
        data: {
          url: `https://placehold.co/300x200?text=${brand.name}`,
          description: `Logo de la marca ${brand.name}`,
          order: 0,
          type: ImageType.BRAND,
          brandId: brand.id,
        },
      }),
    ),
  );

  const deportes = await prisma.category.create({
    data: {
      name: 'Deportes',
      description: 'Accesorios y ropa deportiva',
    },
  });

  await prisma.image.create({
    data: {
      url: 'https://placehold.co/400x300?text=Deportes',
      description: 'Imagen de la categoría Deportes',
      order: 0,
      type: ImageType.CATEGORY,
      categoryId: deportes.id,
    },
  });

  const [zapatillas, accesorios, ropa] = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Zapatillas',
        description: 'Calzado deportivo',
        parentId: deportes.id,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Accesorios',
        description: 'Complementos deportivos',
        parentId: deportes.id,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Ropa',
        description: 'Indumentaria deportiva',
        parentId: deportes.id,
      },
    }),
  ]);

  await Promise.all(
    [zapatillas, accesorios, ropa].map((subcat) =>
      prisma.image.create({
        data: {
          url: `https://placehold.co/400x300?text=${subcat.name}`,
          description: `Imagen de la subcategoría ${subcat.name}`,
          order: 0,
          type: ImageType.CATEGORY,
          categoryId: subcat.id,
        },
      }),
    ),
  );
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
  for (let i = 1; i <= 10; i++) {
    const user = await prisma.user.create({
      data: {
        email: `amayaagustin.2395+${i}@gmail.com`,
        password,
        role: 'CLIENT',
        points: 3000,
        person: {
          create: {
            name: `Cliente ${i}`,
            phone: `381${Math.floor(1000000 + Math.random() * 8999999)}`,
            cuitOrDni: `20${Math.floor(10000000 + Math.random() * 89999999)}`,
          },
        },
      },
    });

    await prisma.address.create({
      data: {
        street: `Calle Falsa ${i}`,
        city: 'San Miguel de Tucumán',
        province: 'Tucumán',
        postalCode: '4000',
        isDefault: true,
        userId: user.id,
        lat: -26.8241 + i * 0.001,
        lng: -65.2226 + i * 0.001,
      },
    });
  }

  for (let i = 1; i <= 2; i++) {
    const admin = await prisma.user.create({
      data: {
        email: `admin+${i}@gmail.com`,
        password,
        role: 'ADMIN',
        person: {
          create: {
            name: `Admin ${i}`,
            phone: `381${Math.floor(1000000 + Math.random() * 8999999)}`,
            cuitOrDni: `27${Math.floor(10000000 + Math.random() * 89999999)}`,
          },
        },
      },
    });

    await prisma.address.create({
      data: {
        street: `Av. Admin ${i}`,
        city: 'San Miguel de Tucumán',
        province: 'Tucumán',
        postalCode: '4000',
        isDefault: true,
        userId: admin.id,
        lat: -26.8141 + i * 0.001,
        lng: -65.2126 + i * 0.001,
      },
    });
  }

  const [red, blue, black] = await Promise.all([
    prisma.color.create({ data: { name: 'Rojo', hex: '#FF0000' } }),
    prisma.color.create({ data: { name: 'Azul', hex: '#0000FF' } }),
    prisma.color.create({ data: { name: 'Negro', hex: '#000000' } }),
  ]);

  const [small, medium, large] = await Promise.all([
    prisma.size.create({ data: { name: 'S' } }),
    prisma.size.create({ data: { name: 'M' } }),
    prisma.size.create({ data: { name: 'L' } }),
  ]);
  const [male, female, unisex] = await Promise.all([
    prisma.gender.create({ data: { name: 'Hombre' } }),
    prisma.gender.create({ data: { name: 'Mujer' } }),
    prisma.gender.create({ data: { name: 'Unisex' } }),
  ]);

  const subcategories = [zapatillas, accesorios, ropa];

  for (let i = 0; i < 32; i++) {
    const name = PRODUCT_NAMES[i % PRODUCT_NAMES.length];
    const brand = [nike, adidas, puma][i % 3];
    const subcategory = subcategories[i % subcategories.length];

    const product = await prisma.product.create({
      data: {
        name: `${name} ${i + 1}`,
        description: `Descripción del producto ${name}`,
        price: 300 + i * 10,
        priceList: 200 + i * 10,
        categoryId: subcategory.id,
        brandId: brand.id,
      },
    });

    await prisma.image.create({
      data: {
        url: `https://placehold.co/600x600?text=${encodeURIComponent(name)}`,
        description: `Imagen del producto ${name}`,
        order: 0,
        type: ImageType.PRODUCT,
        productId: product.id,
      },
    });

    const variant = await prisma.productVariant.create({
      data: {
        productId: product.id,
        colorId: [red, blue, black][i % 3].id,
        sizeId: [small, medium, large][i % 3].id,
        genderId: [male, female, unisex][i % 3].id,
        stock: 10 + i,
      },
    });

    await prisma.image.create({
      data: {
        url: `https://placehold.co/200x200?text=Variante+${i + 1}`,
        description: `Imagen de la variante ${i + 1}`,
        order: 0,
        type: ImageType.VARIANT,
        variantId: variant.id,
      },
    });
  }
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
