import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

type Producto = {
  name: string;
  price: number;
  image: string;
  color: string;
  marca: string;
  categoria: string;
  subcategoria: string;
  gender?: 'MALE' | 'FEMALE' | 'UNISEX';
  sizes?: string[];
};

async function main() {
  const password = await hash('Pass1234', 10);
  const marcas = [
    'Platinum',
    'DormiLindo',
    'Maison',
    'Foschia',
    'Casa Rosario',
    'Yuhmak',
    'Genoud',
    'América Hogar',
    'Atma',
    'Llanos',
    'Philips',
    'Liliana',
    'Inelro',
    'Singer',
    'Striker',
    'Atlét',
    'Vans',
    'Adidas',
    'Bullpadel',
    'Topper',
  ];

  await prisma.brand.createMany({ data: marcas.map((name) => ({ name })) });
  const brands = await prisma.brand.findMany();

  const categorias = [
    {
      name: 'Hogar',
      description: 'Artículos para el hogar',
      subcategorias: [
        { name: 'Placard' },
        { name: 'Placard de pino' },
        { name: 'Cómoda' },
        { name: 'Aparador' },
        { name: 'Ropero' },
        { name: 'Mueble bajo para TV' },
        { name: 'Silla' },
        { name: 'Mesa de luz' },
      ],
    },
    {
      name: 'Tecnologia',
      description: 'Tecnología y electrodomésticos',
      subcategorias: [
        { name: 'Freidora de aire (6.5L)' },
        { name: 'Freidora horno de aire (11.6L)' },
        { name: 'Cocina multigas' },
        { name: 'Caloventor' },
        { name: 'Cuchilla para afeitadora' },
        { name: 'Calefactor infrarrojo' },
        { name: 'Heladera exhibidora' },
        { name: 'Máquina de coser' },
      ],
    },
    {
      name: 'Deportes',
      description: 'Ropa y artículos deportivos',
      subcategorias: [
        { name: 'Pelota de básquet Nº 7' },
        { name: 'Buzo deportivo' },
        { name: 'Zapatillas urbanas' },
        { name: 'Campera técnica' },
        { name: 'Paleta de pádel' },
        { name: 'Botines de fútbol sintético' },
        { name: 'Botines de fútbol' },
      ],
    },
  ];

  const categoriaMap: Record<string, any> = {};

  for (const c of categorias) {
    const created = await prisma.category.create({
      data: {
        name: c.name,
        description: c.description,
        children: {
          create: c.subcategorias.map((s) => ({
            name: s.name,
            description: s.name,
          })),
        },
      },
      include: { children: true },
    });
    categoriaMap[c.name] = created;
  }

  const productos: Producto[] = [
    {
      name: 'Placard 6 Puertas',
      price: 4631,
      image:
        'https://lidermuebles.com.ar/wp-content/uploads/2021/06/272-01-VE.png',
      color: '#FFFFFF', // Blanco
      marca: 'Platinum',
      categoria: 'Hogar',
      subcategoria: 'Placard',
    },
    {
      name: 'Placard de Pino 2 Puertas',
      price: 8635,
      image:
        'https://www.dormilindo.com/wp-content/uploads/2023/09/Blanco-17.png',
      color: '#FFFFFF', // Blanco
      marca: 'DormiLindo',
      categoria: 'Hogar',
      subcategoria: 'Placard de pino',
    },
    {
      name: 'Cómoda 6 Cajones',
      price: 2739,
      image:
        'https://www.el-mueble.com.ar/showroom/wp-content/uploads/2020/06/Co%CC%81moda-Maison-8-cajones-1-1.jpg',
      color: '#FFFFFF', // Blanco (primer color de "Blanco/Roble/Miel")
      marca: 'Maison',
      categoria: 'Hogar',
      subcategoria: 'Cómoda',
    },
    {
      name: 'Despensero 2 Puertas',
      price: 1309,
      image:
        'https://d2eebw31vcx88p.cloudfront.net/foschiads/uploads/a399255d8dcc04df846c829c333e923258494372.jpg',
      color: '#FFFFFF', // Blanco (primer color de "Blanco con detalles madera")
      marca: 'Foschia',
      categoria: 'Hogar',
      subcategoria: 'Aparador',
    },
    {
      name: 'Placard Venezia 4 Puertas',
      price: 4169,
      image:
        'https://casarosario.com.ar/wp-content/uploads/2020/06/916-TABACO.png',
      color: '#A0522D', // Tabaco (aproximación)
      marca: 'Casa Rosario',
      categoria: 'Hogar',
      subcategoria: 'Ropero',
    },
    {
      name: 'Mueble Bajo para TV',
      price: 3696,
      image:
        'https://yuhmak.vtexassets.com/arquivos/ids/179196/E0000019455--2-.png?v=638342958168930000',
      color: '#FFFFFF', // Blanco (primer color de "Blanco con detalles grises")
      marca: 'Yuhmak',
      categoria: 'Hogar',
      subcategoria: 'Mueble bajo para TV',
    },
    {
      name: 'Silla Mediterránea',
      price: 1529,
      image:
        'https://genoudmuebles.com.ar/contenidos/productos/640/img/big/GND-Silla-Sapporo-001.jpg',
      color: '#A0522D', // Madera natural (aproximación)
      marca: 'Genoud',
      categoria: 'Hogar',
      subcategoria: 'Silla',
    },
    {
      name: 'Mesa de Luz 3 Cajones',
      price: 2189,
      image:
        'https://www.mueblesamerica.mx/img/1024/1024/resize/P/E/PEHE00005_x1.jpg',
      color: '#FFFFFF', // Blanco mate (asumiendo blanco)
      marca: 'América Hogar',
      categoria: 'Hogar',
      subcategoria: 'Mesa de luz',
    },
    {
      name: 'Freidora De Aire 6.5L',
      price: 1199,
      image:
        'https://www.megatone.net/Images/Articulos/zoom/501/FRE0600ATM.jpg?version=35',
      color: '#000000', // Negro
      marca: 'Atma',
      categoria: 'Tecnologia',
      subcategoria: 'Freidora de aire (6.5L)',
    },
    {
      name: 'Freidora Horno 11.6L',
      price: 1599,
      image:
        'https://www.megatone.net/Images/Articulos/zoom/501/FRE5820ATM.jpg?version=35',
      color: '#000000', // Negro (primer color de "Negro con panel digital")
      marca: 'Atma',
      categoria: 'Tecnologia',
      subcategoria: 'Freidora horno de aire (11.6L)',
    },
    {
      name: 'Cocina Multigas Acero',
      price: 6299,
      image:
        'https://www.megatone.net/images/Articulos/zoom/31/MKT0089LLA-1.png?version=35',
      color: '#808080', // Acero inoxidable (asumiendo gris)
      marca: 'Llanos',
      categoria: 'Tecnologia',
      subcategoria: 'Cocina multigas',
    },
    {
      name: 'Caloventor 2000W',
      price: 399,
      image:
        'https://www.megatone.net/Images/Articulos/zoom/62/CAL2012ATM.jpg?version=35',
      color: '#FFFFFF', // Blanco (primer color de "Blanco/Negro")
      marca: 'Atma',
      categoria: 'Tecnologia',
      subcategoria: 'Caloventor',
    },
    {
      name: 'Repuesto Cuchilla Oneblade',
      price: 259,
      image:
        'https://www.megatone.net/Images/Articulos/zoom/76/REP2206PHI.jpg?version=35',
      color: '#008000', // Verde (primer color de "Verde y gris")
      marca: 'Philips',
      categoria: 'Tecnologia',
      subcategoria: 'Cuchilla para afeitadora',
    },
    {
      name: 'Calefactor Infrarrojo CI080',
      price: 499,
      image:
        'https://www.megatone.net/Images/Articulos/zoom/62/CAL1080LIL.jpg?version=35',
      color: '#FFFFFF', // Blanco (primer color de "Blanco/Naranja")
      marca: 'Liliana',
      categoria: 'Tecnologia',
      subcategoria: 'Calefactor infrarrojo',
    },
    {
      name: 'Exhibidora Inelro 460L',
      price: 11999,
      image:
        'https://www.megatone.net/Images/Articulos/zoom/33/EXH4600INE.jpg?version=35',
      color: '#FFFFFF', // Blanco (primer color de "Blanco/Transparente")
      marca: 'Inelro',
      categoria: 'Tecnologia',
      subcategoria: 'Heladera exhibidora',
    },
    {
      name: 'Máquina De Coser Singer',
      price: 3079,
      image:
        'https://www.megatone.net/Images/Articulos/zoom/88/MQC1605SIN.jpg?version=35',
      color: '#FFFFFF', // Blanco (primer color de "Blanco/Rojo")
      marca: 'Singer',
      categoria: 'Tecnologia',
      subcategoria: 'Máquina de coser',
    },
    {
      name: 'Pelota Básquet Striker Nº 7',
      price: 2549,
      image:
        'https://sportingio.vtexassets.com/arquivos/ids/211267-300-300?v=637384697133400000&width=300&height=300&aspect=true',
      color: '#FFA500', // Naranja (primer color de "Naranja con negro")
      marca: 'Striker',
      categoria: 'Deportes',
      subcategoria: 'Pelota de básquet Nº 7',
    },
    {
      name: 'Buzo Deportivo Hombre',
      price: 3999,
      image:
        'https://sportingio.vtexassets.com/arquivos/ids/1259083-300-300?v=638524206156500000&width=300&height=300&aspect=true',
      color: '#ADD8E6', // Celeste
      marca: 'Atlét',
      categoria: 'Deportes',
      subcategoria: 'Buzo deportivo',
      gender: 'MALE',
      sizes: ['S', 'M', 'L', 'XL'],
    },
    {
      name: 'Zapatillas Vans Authentic',
      price: 9499,
      image:
        'https://sportingio.vtexassets.com/arquivos/ids/345044-300-300?v=637648790109370000&width=300&height=300&aspect=true',
      color: '#000000', // Negro (primer color de "Negro con suela blanca")
      marca: 'Vans',
      categoria: 'Deportes',
      subcategoria: 'Zapatillas urbanas',
      gender: 'FEMALE',
      sizes: ['36', '37', '38', '39', '40', '41', '42', '43', '44'],
    },
    {
      name: 'Campera Adidas Terrex',
      price: 7259,
      image:
        'https://sportingio.vtexassets.com/arquivos/ids/1319402-300-300?v=638551142601100000&width=300&height=300&aspect=true',
      color: '#90EE90', // Verde claro
      marca: 'Adidas',
      categoria: 'Deportes',
      subcategoria: 'Campera técnica',
      gender: 'MALE',
      sizes: ['S', 'M', 'L', 'XL'],
    },
    {
      name: 'Paleta Pádel Bullpadel Neuron',
      price: 4999,
      image:
        'https://sportingio.vtexassets.com/arquivos/ids/1369451-300-300?v=638581377841330000&width=300&height=300&aspect=true',
      color: '#000000', // Negro (primer color de "Negro con blanco")
      marca: 'Bullpadel',
      categoria: 'Deportes',
      subcategoria: 'Paleta de pádel',
    },
    {
      name: 'Botines Topper Titanium Hombre',
      price: 3999,
      image:
        'https://sportingio.vtexassets.com/arquivos/ids/1438863-300-300?v=638611633478500000&width=300&height=300&aspect=true',
      color: '#FF0000', // Rojo (primer color de "Rojo con gris")
      marca: 'Topper',
      categoria: 'Deportes',
      subcategoria: 'Botines de fútbol sintético',
      gender: 'UNISEX',
      sizes: ['38', '39', '40', '41', '42', '43'],
    },
    {
      name: 'Pelota Básquet Adidas Nº 7',
      price: 3999,
      image:
        'https://sportingio.vtexassets.com/arquivos/ids/1702116-300-300?v=638696070677870000&width=300&height=300&aspect=true',
      color: '#FFA500', // Naranja (primer color de "Naranja con negro")
      marca: 'Adidas',
      categoria: 'Deportes',
      subcategoria: 'Pelota de básquet Nº 7',
    },
    {
      name: 'Botines Adidas Predator Club',
      price: 7699,
      image:
        'https://sportingio.vtexassets.com/arquivos/ids/1469194-300-300?v=638641821913730000&width=300&height=300&aspect=true',
      color: '#C0C0C0', // Plateado (primer color de "Plateado con negro", asumiendo gris claro)
      marca: 'Adidas',
      categoria: 'Deportes',
      subcategoria: 'Botines de fútbol',
      gender: 'MALE',
      sizes: ['38', '39', '40', '41', '42', '43'],
    },
  ];

  for (const prod of productos) {
    const brand = brands.find((b) => b.name === prod.marca);
    const categoriaPadre = categoriaMap[prod.categoria];
    const subcategoria = categoriaPadre.children.find(
      (c: any) => c.name === prod.subcategoria,
    );

    const offerPrice = Number(
      (prod.price * faker.number.float({ min: 0.7, max: 0.95 })).toFixed(2),
    );

    const product = await prisma.product.create({
      data: {
        name: prod.name,
        description: faker.commerce.productDescription(),
        priceList: offerPrice,
        price: prod.price,
        isService: false,
        isActive: true,
        hasDelivery: true,
        brandId: brand?.id,
        categoryId: subcategoria.id,
      },
    });

    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: prod.image,
        description: `Imagen de ${prod.name}`,
        order: 0,
      },
    });

    for (const size of prod.sizes ?? ['ÚNICO']) {
      await prisma.productVariant.create({
        data: {
          color: prod.color,
          size,
          gender: prod.gender,
          stock: faker.number.int({ min: 5, max: 20 }),
          productId: product.id,
        },
      });
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
  await prisma.user.create({
    data: {
      email: 'admin@gmail.com',
      password,
      role: 'ADMIN',
      person: {
        create: {
          name: 'Admin',
          phone: faker.phone.number(),
          cuitOrDni: faker.string.numeric(11),
        },
      },
    },
  });
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
