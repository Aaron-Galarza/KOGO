import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from '../src/modules/users/users.model';
import { CategoriaModel } from '../src/modules/categories/categories.model';
import { ProductModel } from '../src/modules/products/products.model';
import { OpcionModel } from '../src/modules/options/options.model';
import { GrupoOpcionesModel } from '../src/modules/option-groups/optionGroups.model';
import { AdicionalModel } from '../src/modules/additionals/additionals.model';
import { ConfigModel } from '../src/modules/config/config.model';
import { BannerModel } from '../src/modules/banners/banners.model';
import { CouponModel } from '../src/modules/coupons/coupons.model';

dotenv.config();

const img = (text: string) =>
  `https://via.placeholder.com/300x300?text=${encodeURIComponent(text)}`;

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || '');
    console.log('Connected to MongoDB');

    await CategoriaModel.deleteMany({});
    await ProductModel.deleteMany({});
    await OpcionModel.deleteMany({});
    await GrupoOpcionesModel.deleteMany({});
    await AdicionalModel.deleteMany({});
    await ConfigModel.deleteMany({});
    await BannerModel.deleteMany({});
    await CouponModel.deleteMany({});
    await User.deleteMany({});
    console.log('Cleared existing data');

    // ---------------------------------------------------------
    // CATEGORÍAS (con subcategorías de Ramen)
    // ---------------------------------------------------------
    const kogos = await CategoriaModel.create({ name: 'Kogos', order: 0, active: true });
    const kimbap = await CategoriaModel.create({
      name: 'Kimbap',
      description: 'Roll coreano de arroz y alga, 10 unidades.',
      order: 1,
      active: true,
    });
    const ramenParent = await CategoriaModel.create({
      name: 'Ramen',
      order: 2,
      active: false,
    });
    const ramenLocal = await CategoriaModel.create({
      name: 'Ramen en local',
      order: 3,
      active: true,
      parent: ramenParent._id,
    });
    const ramenTakeaway = await CategoriaModel.create({
      name: 'Ramen para llevar',
      description: 'Consultar en caja por otros ramen.',
      order: 4,
      active: true,
      parent: ramenParent._id,
    });
    console.log('Categories created');

    // ---------------------------------------------------------
    // OPCIONES / INGREDIENTES reutilizables
    // ---------------------------------------------------------
    const optionDefs: { nombre: string; precio: number; descripcion?: string }[] = [
      // Aderezos
      { nombre: 'Mayonesa', precio: 0 },
      { nombre: 'Mostaza', precio: 0 },
      { nombre: 'Ketchup', precio: 0 },
      { nombre: 'Salsa cheddar', precio: 0 },
      { nombre: 'Mayo Gochujang', precio: 0 },
      { nombre: 'Salsa chili', precio: 0 },
      // Bases (Kogo Full)
      { nombre: 'Salchicha alemana', precio: 0 },
      { nombre: 'Salchicha y muzza', precio: 0 },
      { nombre: 'Muzza', precio: 0 },
      { nombre: 'Salchicha y cheddar', precio: 0 },
      // Rebozados (Kogo Full)
      { nombre: 'Panko', precio: 0 },
      { nombre: 'Cubos de papas', precio: 0 },
      { nombre: 'Ramen Crunch', precio: 1999 },
      // Toppings (Kogo Full)
      { nombre: 'Papas Pay', precio: 0 },
      { nombre: 'Queso Sardo', precio: 0 },
      // Toppings (Ramen)
      { nombre: 'Queso cheddar', precio: 0 },
      { nombre: 'Huevo', precio: 0 },
      { nombre: 'Cebollita de verdeo', precio: 0 },
    ];

    const createdOptions = await OpcionModel.insertMany(
      optionDefs.map((o, i) => ({ ...o, activo: true, disponible: true, orden: i }))
    );
    const optId = (nombre: string): string => {
      const found = createdOptions.find((o) => o.nombre === nombre);
      if (!found) throw new Error(`Opción no encontrada: ${nombre}`);
      return String(found._id);
    };
    console.log(`${createdOptions.length} options created`);

    // ---------------------------------------------------------
    // GRUPOS DE OPCIONES reutilizables
    // ---------------------------------------------------------
    const groupOptions = (names: string[]) =>
      names.map((n, i) => ({
        ingrediente: optId(n),
        orden: i,
        activo: true,
        permiteCantidad: false,
        cantidadMaxima: 1,
        precioEspecial: null,
      }));

    const gBase = await GrupoOpcionesModel.create({
      nombre: 'Elegí la base',
      tipo: 'unico',
      obligatorio: true,
      minimo: 1,
      maximo: 1,
      activo: true,
      ingredientes: groupOptions(['Salchicha alemana', 'Salchicha y muzza', 'Muzza', 'Salchicha y cheddar']),
    });

    const gRebozado = await GrupoOpcionesModel.create({
      nombre: 'Elegí el rebozado',
      tipo: 'unico',
      obligatorio: true,
      minimo: 1,
      maximo: 1,
      activo: true,
      ingredientes: groupOptions(['Panko', 'Cubos de papas', 'Ramen Crunch']),
    });

    const gAderezos = await GrupoOpcionesModel.create({
      nombre: 'Elegí los aderezos',
      descripcion: 'Elegí dos aderezos',
      tipo: 'multiple',
      obligatorio: true,
      minimo: 2,
      maximo: 2,
      activo: true,
      ingredientes: groupOptions([
        'Mayonesa',
        'Mostaza',
        'Ketchup',
        'Salsa cheddar',
        'Mayo Gochujang',
        'Salsa chili',
      ]),
    });

    const gToppingFull = await GrupoOpcionesModel.create({
      nombre: 'Elegí el topping',
      tipo: 'unico',
      obligatorio: true,
      minimo: 1,
      maximo: 1,
      activo: true,
      ingredientes: groupOptions(['Papas Pay', 'Queso Sardo']),
    });

    const gToppingRamen = await GrupoOpcionesModel.create({
      nombre: 'Elegí un topping',
      tipo: 'unico',
      obligatorio: true,
      minimo: 1,
      maximo: 1,
      activo: true,
      ingredientes: groupOptions(['Queso cheddar', 'Huevo', 'Cebollita de verdeo']),
    });
    console.log('Option groups created');

    // ---------------------------------------------------------
    // PRODUCTOS
    // ---------------------------------------------------------
    const simple = (title: string, price: number, category: any, description?: string) => ({
      title,
      description,
      price,
      category: category._id,
      image: img(title),
      active: true,
      controlStock: false,
      stock: 0,
      tipoProducto: 'simple' as const,
      gruposOpciones: [],
    });

    const products = await ProductModel.insertMany([
      // --- Kogos ---
      simple('Kogo Junior', 4999, kogos, 'Salchicha de viena, rebozado Panko y dos aderezos.'),
      simple('Kogo Clásico', 7799, kogos, 'Salchicha alemana, rebozado Panko y dos aderezos.'),
      {
        ...simple('Kogo Full', 10999, kogos, 'Base a elección, rebozado, dos aderezos y un topping.'),
        tipoProducto: 'configurable' as const,
        gruposOpciones: [
          { grupo: gBase._id, orden: 0 },
          { grupo: gRebozado._id, orden: 1 },
          { grupo: gAderezos._id, orden: 2 },
          { grupo: gToppingFull._id, orden: 3 },
        ],
      },

      // --- Kimbap (simples) ---
      simple('Jeyuk', 14999, kimbap, 'Cerdo picante estilo coreano, vegetales frescos y salteados.'),
      simple('Bulgogui', 13399, kimbap, 'Carne marinada en salsa de soja, vegetales frescos y salteados.'),
      simple('Pollo Crispy', 13399, kimbap, 'Pollo crocante, mayo Gochujang, vegetales frescos y salteados.'),
      simple('Tuna', 13399, kimbap, 'Atún con mayonesa, vegetales frescos y salteados.'),
      simple('Veggie', 13399, kimbap, 'Tofu salteado en salsa de soja, vegetales frescos y salteados.'),

      // --- Ramen en local (configurables: eligen topping) ---
      ...[
        ['Ansungtangmyun', 12300],
        ['Shin Ramyun', 12300],
        ['Jin Ramyun', 12300],
        ['Samyang Ramyun', 12300],
        ['Gomtang', 12300],
        ['Neoguri suave', 12300],
        ['Neoguri picante', 12300],
        ['Chapagetti', 13400],
        ['Chapaguri', 13400],
        ['Buldak', 13400],
      ].map(([title, price]) => ({
        ...simple(String(title), Number(price), ramenLocal),
        tipoProducto: 'configurable' as const,
        gruposOpciones: [{ grupo: gToppingRamen._id, orden: 0 }],
      })),

      // --- Ramen para llevar (simples) ---
      simple('Buldak Cup', 7799, ramenTakeaway),
      simple('Samyang Cup', 7799, ramenTakeaway),
    ]);
    console.log(`${products.length} products created`);

    // ---------------------------------------------------------
    // CONFIG
    // ---------------------------------------------------------
    await ConfigModel.create({
      isOpen: true,
      isEmergencyClosed: false,
      emergencyMessage: '',
      banner: 'https://via.placeholder.com/1200x300?text=KOGO',
      isAllClose: false,
      dailySchedule: [
        { day: 'Lunes', isStoreOpen: false, ranges: [] },
        { day: 'Martes', isStoreOpen: true, ranges: [{ open: '11:30', close: '14:00' }, { open: '18:30', close: '22:30' }] },
        { day: 'Miércoles', isStoreOpen: true, ranges: [{ open: '11:30', close: '14:00' }, { open: '18:30', close: '22:30' }] },
        { day: 'Jueves', isStoreOpen: true, ranges: [{ open: '11:30', close: '14:00' }, { open: '18:30', close: '22:30' }] },
        { day: 'Viernes', isStoreOpen: true, ranges: [{ open: '11:30', close: '14:00' }, { open: '18:30', close: '23:00' }] },
        { day: 'Sábado', isStoreOpen: true, ranges: [{ open: '11:30', close: '14:00' }, { open: '18:30', close: '23:00' }] },
        { day: 'Domingo', isStoreOpen: true, ranges: [{ open: '19:00', close: '23:00' }] },
      ],
    });
    console.log('Config created');

    // ---------------------------------------------------------
    // BANNERS
    // ---------------------------------------------------------
    await BannerModel.insertMany([
      {
        title: 'KOGO',
        description: 'Korean street food en Corrientes',
        image: 'https://via.placeholder.com/1200x400?text=KOGO',
        order: 0,
        active: true,
      },
    ]);
    console.log('Banners created');

    // ---------------------------------------------------------
    // CUPÓN: 10% de descuento por pago en efectivo
    // ---------------------------------------------------------
    await CouponModel.create({
      code: 'EFECTIVO',
      discountPercent: 10,
      active: true,
      validDays: [],
      validPaymentMethods: ['cash'],
    });
    console.log('Cash discount coupon created');

    // ---------------------------------------------------------
    // USUARIO ADMIN
    // ---------------------------------------------------------
    await User.create({
      email: 'admin@kogo.com',
      passwordHash: 'admin123',
      role: 'admin',
    });
    console.log('Admin user created');

    console.log('\nDatabase seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedDatabase();
