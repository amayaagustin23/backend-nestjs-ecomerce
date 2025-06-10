import { faker } from '@faker-js/faker';
import {
  EcommerceType,
  ImageType,
  IndustryType,
  PrismaClient,
} from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

interface ProductData {
  name: string;
  description: string;
  price: number;
  priceList: number;
  categoryName: string;
  brandName: string;
  variants: string[];
  imageUrls: string[];
  colorName: string;
}

async function createProductWithVariantsAndImages(
  productData: ProductData,
  brandId: string,
  categoryId: string,
  colorId: string,
  sizes: Record<string, string>,
  maleGenderId: string,
) {
  const product = await prisma.product.create({
    data: {
      name: productData.name,
      description: productData.description,
      price: productData.price,
      priceList: productData.priceList,
      categoryId,
      brandId,
      variants: {
        createMany: {
          data: productData.variants.map((size) => ({
            colorId,
            sizeId: sizes[size] || null,
            genderId: maleGenderId,
            stock: 10,
          })),
        },
      },
    },
  });

  const productVariants = await prisma.productVariant.findMany({
    where: { productId: product.id },
  });

  for (const variant of productVariants) {
    await prisma.image.createMany({
      data: productData.imageUrls.map((url, index) => ({
        url,
        type: ImageType.VARIANT,
        variantId: variant.id,
        order: index,
      })),
    });
  }
}

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

  const [adidas, atleticoTucuman, topper, nike, puma, saucony] =
    await Promise.all([
      prisma.brand.upsert({
        where: { name: 'Adidas' },
        update: {},
        create: { name: 'Adidas' },
      }),
      prisma.brand.upsert({
        where: { name: 'Atlético Tucumán' },
        update: {},
        create: { name: 'Atlético Tucumán' },
      }),
      prisma.brand.upsert({
        where: { name: 'Topper' },
        update: {},
        create: { name: 'Topper' },
      }),
      prisma.brand.upsert({
        where: { name: 'Nike' },
        update: {},
        create: { name: 'Nike' },
      }),
      prisma.brand.upsert({
        where: { name: 'Puma' },
        update: {},
        create: { name: 'Puma' },
      }),
      prisma.brand.upsert({
        where: { name: 'Saucony' },
        update: {},
        create: { name: 'Saucony' },
      }),
    ]);
  const brands = {
    Adidas: adidas.id,
    'Atlético Tucumán': atleticoTucuman.id,
    Topper: topper.id,
    Nike: nike.id,
    Puma: puma.id,
    Saucony: saucony.id,
  };

  const [camisetas, ropa, moda, training, running, futbol, padel, basquet] =
    await Promise.all([
      prisma.category.upsert({
        where: { name: 'Camisetas' },
        update: {},
        create: { name: 'Camisetas', description: 'Camisetas' },
      }),
      prisma.category.upsert({
        where: { name: 'Ropa' },
        update: {},
        create: { name: 'Ropa', description: 'Indumentaria' },
      }),
      prisma.category.upsert({
        where: { name: 'Moda' },
        update: {},
        create: { name: 'Moda', description: 'Artículos de moda' },
      }),
      prisma.category.upsert({
        where: { name: 'Training' },
        update: {},
        create: {
          name: 'Training',
          description: 'Ropa y accesorios para entrenamiento',
        },
      }),
      prisma.category.upsert({
        where: { name: 'Running' },
        update: {},
        create: { name: 'Running', description: 'Calzado y ropa para correr' },
      }),
      prisma.category.upsert({
        where: { name: 'Fútbol' },
        update: {},
        create: {
          name: 'Fútbol',
          description: 'Botines y accesorios para fútbol',
        },
      }),
      prisma.category.upsert({
        where: { name: 'Padel' },
        update: {},
        create: { name: 'Padel', description: 'Artículos de Padel' },
      }),
      prisma.category.upsert({
        where: { name: 'Basquet' },
        update: {},
        create: { name: 'Basquet', description: 'Artículos de Basquet' },
      }),
    ]);
  const categories = {
    Camiseta: camisetas.id,
    Ropa: ropa.id,
    Moda: moda.id,
    TRAINING: training.id,
    Running: running.id,
    Fútbol: futbol.id,
    Padel: padel.id,
    Basquet: basquet.id,
  };

  const [blanco, negro, verde, grey, amarillo, rojo, naranja] =
    await Promise.all([
      prisma.color.upsert({
        where: { hex: '#FFFFFF' },
        update: {},
        create: { name: 'Blanco', hex: '#FFFFFF' },
      }),
      prisma.color.upsert({
        where: { hex: '#000000' },
        update: {},
        create: { name: 'Negro', hex: '#000000' },
      }),
      prisma.color.upsert({
        where: { hex: '#008000' },
        update: {},
        create: { name: 'Verde', hex: '#008000' },
      }),
      prisma.color.upsert({
        where: { hex: '#808080' },
        update: {},
        create: { name: 'Gris', hex: '#808080' },
      }),
      prisma.color.upsert({
        where: { hex: '#FFFF00' },
        update: {},
        create: { name: 'Amarillo', hex: '#FFFF00' },
      }),
      prisma.color.upsert({
        where: { hex: '#FF0000' },
        update: {},
        create: { name: 'Rojo', hex: '#FF0000' },
      }),
      prisma.color.upsert({
        where: { hex: '#FFA500' },
        update: {},
        create: { name: 'Naranja', hex: '#FFA500' },
      }),
    ]);
  const colors = {
    blanco: blanco.id,
    negro: negro.id,
    verde: verde.id,
    grey: grey.id,
    amarillo: amarillo.id,
    Rojo: rojo.id,
    Verde: verde.id,
    naranja: naranja.id,
  };

  const [
    small,
    medium,
    large,
    xxl,
    size40,
    size41,
    size42,
    size43,
    size44,
    unico,
  ] = await Promise.all([
    prisma.size.upsert({
      where: { name: 'S' },
      update: {},
      create: { name: 'S' },
    }),
    prisma.size.upsert({
      where: { name: 'M' },
      update: {},
      create: { name: 'M' },
    }),
    prisma.size.upsert({
      where: { name: 'L' },
      update: {},
      create: { name: 'L' },
    }),
    prisma.size.upsert({
      where: { name: 'XXL' },
      update: {},
      create: { name: 'XXL' },
    }),
    prisma.size.upsert({
      where: { name: '40' },
      update: {},
      create: { name: '40' },
    }),
    prisma.size.upsert({
      where: { name: '41' },
      update: {},
      create: { name: '41' },
    }),
    prisma.size.upsert({
      where: { name: '42' },
      update: {},
      create: { name: '42' },
    }),
    prisma.size.upsert({
      where: { name: '43' },
      update: {},
      create: { name: '43' },
    }),
    prisma.size.upsert({
      where: { name: '44' },
      update: {},
      create: { name: '44' },
    }),
    prisma.size.upsert({
      where: { name: 'Unico' },
      update: {},
      create: { name: 'Unico' },
    }),
  ]);
  const sizesMap = {
    S: small.id,
    M: medium.id,
    L: large.id,
    XXL: xxl.id,
    '40': size40.id,
    '41': size41.id,
    '42': size42.id,
    '43': size43.id,
    '44': size44.id,
    Unico: unico.id,
  };

  const male = await prisma.gender.upsert({
    where: { name: 'Hombre' },
    update: {},
    create: { name: 'Hombre' },
  });
  const maleGenderId = male.id;

  const productsData: ProductData[] = [
    {
      name: 'Camiseta adidas River Plate Titular 24/25 De Hombre',
      description:
        'Camiseta oficial adidas del Club Atlético River Plate temporada 2024/2025 para hombre.',
      price: 1000,
      priceList: 900,
      categoryName: 'Camiseta',
      brandName: 'Adidas',
      variants: ['S', 'M', 'L', 'XXL'],
      imageUrls: [
        'https://sporting.vtexassets.com/arquivos/ids/1432471-1200-1200?v=638605445956530000&width=1200&height=1200&aspect=true',
        'https://sporting.vtexassets.com/arquivos/ids/1432473-1200-1200?v=638605445960700000&width=1200&height=1200&aspect=true',
      ],
      colorName: 'blanco',
    },
    {
      name: 'Remera Atlét Térmica De Hombre',
      description: 'Remera térmica deportiva de Atlético Tucumán para hombre.',
      price: 1200,
      priceList: 800,
      categoryName: 'Ropa',
      brandName: 'Atlético Tucumán',
      variants: ['S', 'M', 'L', 'XXL'],
      imageUrls: [
        'https://sporting.vtexassets.com/arquivos/ids/2039670-1200-1200?v=638842276583000000&width=1200&height=1200&aspect=true',
        'https://sporting.vtexassets.com/arquivos/ids/2039671-1200-1200?v=638842276587400000&width=1200&height=1200&aspect=true',
      ],
      colorName: 'blanco',
    },
    {
      name: 'Campera Atlét Basic De Hombre',
      description: 'Campera básica de Atlético Tucumán para hombre.',
      price: 800,
      priceList: 700,
      categoryName: 'Moda',
      brandName: 'Atlético Tucumán',
      variants: ['S', 'M', 'L'],
      imageUrls: [
        'https://sporting.vtexassets.com/arquivos/ids/2038669-1200-1200?v=638842246683030000&width=1200&height=1200&aspect=true',
        'https://sporting.vtexassets.com/arquivos/ids/2038670-1200-1200?v=638842246686770000&width=1200&height=1200&aspect=true',
      ],
      colorName: 'negro',
    },
    {
      name: 'Conjunto Topper Train Bs Wv De Hombre',
      description: 'Conjunto deportivo Topper para entrenamiento de hombre.',
      price: 2500,
      priceList: 2200,
      categoryName: 'TRAINING',
      brandName: 'Topper',
      variants: ['S', 'M', 'L'],
      imageUrls: [
        'https://sporting.vtexassets.com/arquivos/ids/540693-1200-1200?v=637903740773970000&width=1200&height=1200&aspect=true',
        'https://sporting.vtexassets.com/arquivos/ids/540695-1200-1200?v=637903740776670000&width=1200&height=1200&aspect=true',
      ],
      colorName: 'negro',
    },
    {
      name: 'Short Atlét Running 7" 2 En 1 De Hombre',
      description:
        'Short deportivo 2 en 1 para running de Atlético Tucumán de hombre.',
      price: 900,
      priceList: 750,
      categoryName: 'TRAINING',
      brandName: 'Atlético Tucumán',
      variants: ['S', 'M', 'L'],
      imageUrls: [
        'https://sporting.vtexassets.com/arquivos/ids/1242953-1200-1200?v=638507926440300000&width=1200&height=1200&aspect=true',
        'https://sporting.vtexassets.com/arquivos/ids/1242957-1200-1200?v=638507926443900000&width=1200&height=1200&aspect=true',
      ],
      colorName: 'verde',
    },
    {
      name: 'Zapatillas adidas Questar 3 De Hombre',
      description: 'Zapatillas de running adidas Questar 3 para hombre.',
      price: 3200,
      priceList: 2800,
      categoryName: 'Running',
      brandName: 'Adidas',
      variants: ['40', '41', '42', '43'],
      imageUrls: [
        'https://sportingio.vtexassets.com/arquivos/ids/1860368-1200-1200?v=638742909642170000&width=1200&height=1200&aspect=true',
        'https://sportingio.vtexassets.com/arquivos/ids/1860369-1200-1200?v=638742909656800000&width=1200&height=1200&aspect=true',
      ],
      colorName: 'grey',
    },
    {
      name: 'Botines Nike Mercurial Vapor 16 Academy FG De Hombre',
      description:
        'Botines de fútbol Nike Mercurial Vapor 16 Academy FG para hombre.',
      price: 4500,
      priceList: 4000,
      categoryName: 'Fútbol',
      brandName: 'Nike',
      variants: ['40', '41', '42', '43', '44'],
      imageUrls: [
        'https://sportingio.vtexassets.com/arquivos/ids/1880637-1200-1200?v=638754742697600000&width=1200&height=1200&aspect=true',
        'https://sportingio.vtexassets.com/arquivos/ids/1880642-1200-1200?v=638754742700870000&width=1200&height=1200&aspect=true',
      ],
      colorName: 'amarillo',
    },
    {
      name: 'Zapatillas Saucony Axon 3 De Hombre',
      description: 'Zapatillas Saucony Axon 3 De Hombre',
      price: 5200,
      priceList: 4800,
      categoryName: 'Running',
      brandName: 'Saucony',
      variants: ['40', '41', '42', '43', '44'],
      imageUrls: [
        'https://sporting.vtexassets.com/arquivos/ids/1281896-1200-1200?v=638537322164000000&width=1200&height=1200&aspect=true',
        'https://sporting.vtexassets.com/arquivos/ids/1281897-1200-1200?v=638537322168430000&width=1200&height=1200&aspect=true',
      ],
      colorName: 'negro',
    },
    {
      name: 'Zapatillas Puma Skyrocket Lite De Hombre',
      description: 'Zapatillas Puma Skyrocket Lite De Hombre',
      price: 3800,
      priceList: 3500,
      categoryName: 'Running',
      brandName: 'Puma',
      variants: ['40', '41', '42', '43', '44'],
      imageUrls: [
        'https://sporting.vtexassets.com/arquivos/ids/1166263-1200-1200?v=638482860023300000&width=1200&height=1200&aspect=true',
        'https://sporting.vtexassets.com/arquivos/ids/1166284-1200-1200?v=638482860043000000&width=1200&height=1200&aspect=true',
      ],
      colorName: 'Rojo',
    },
    {
      name: 'Mochila Puma Phase 22 Litros',
      description: 'Mochila Puma Phase 22 Litros',
      price: 1500,
      priceList: 1200,
      categoryName: 'Moda',
      brandName: 'Puma',
      variants: ['Unico'],
      imageUrls: [
        'https://sporting.vtexassets.com/arquivos/ids/1448771-1200-1200?v=638623507458100000&width=1200&height=1200&aspect=true',
        'https://sporting.vtexassets.com/arquivos/ids/1448772-1200-1200?v=638623507464370000&width=1200&height=1200&aspect=true',
      ],
      colorName: 'Verde',
    },
    {
      name: 'Paleta De Padel adidas Metalbone Carbon HRD 3.3',
      description: 'Paleta De Padel adidas Metalbone Carbon HRD 3.3',
      price: 18000,
      priceList: 15000,
      categoryName: 'Padel',
      brandName: 'Adidas',
      variants: ['Unico'],
      imageUrls: [
        'https://sporting.vtexassets.com/arquivos/ids/1445554-1200-1200?v=638618300960770000&width=1200&height=1200&aspect=true',
        'https://sporting.vtexassets.com/arquivos/ids/1445555-1200-1200?v=638618300965600000&width=1200&height=1200&aspect=true',
      ],
      colorName: 'negro',
    },
    {
      name: 'Bolso Puma Small Sport Unisex',
      description: 'Bolso Puma Small Sport Unisex',
      price: 2200,
      priceList: 1900,
      categoryName: 'TRAINING',
      brandName: 'Puma',
      variants: ['Unico'],
      imageUrls: [
        'https://sporting.vtexassets.com/arquivos/ids/1621088-1200-1200?v=638671846555600000&width=1200&height=1200&aspect=true',
        'https://sporting.vtexassets.com/arquivos/ids/1621089-1200-1200?v=638671846561570000&width=1200&height=1200&aspect=true',
      ],
      colorName: 'Verde',
    },
    {
      name: 'Pelota De Basquet Striker Nº 7',
      description: 'Pelota De Basquet Striker Nº 7',
      price: 1100,
      priceList: 950,
      categoryName: 'Basquet',
      brandName: 'Striker',
      variants: ['Unico'],
      imageUrls: [
        'https://sporting.vtexassets.com/arquivos/ids/211267-1200-1200?v=637384697133400000&width=1200&height=1200&aspect=true',
      ],
      colorName: 'naranja',
    },
  ];

  for (const productData of productsData) {
    const brandId = brands[productData.brandName];
    const categoryId = categories[productData.categoryName];
    const colorId = colors[productData.colorName];

    if (brandId && categoryId && colorId) {
      await createProductWithVariantsAndImages(
        productData,
        brandId,
        categoryId,
        colorId,
        sizesMap,
        maleGenderId,
      );
    } else {
    }
  }

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
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
