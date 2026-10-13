import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from '../src/modules/users/users.model';
import { CategoriaModel } from '../src/modules/categories/categories.model';
import { ProductModel } from '../src/modules/products/products.model';
import { AdicionalModel } from '../src/modules/additionals/additionals.model';
import { ConfigModel } from '../src/modules/config/config.model';
import { BannerModel } from '../src/modules/banners/banners.model';

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || '');
    console.log('Connected to MongoDB');

    await CategoriaModel.deleteMany({});
    await ProductModel.deleteMany({});
    await AdicionalModel.deleteMany({});
    await ConfigModel.deleteMany({});
    await BannerModel.deleteMany({});
    await User.deleteMany({});
    console.log('Cleared existing data');

    const categories = await CategoriaModel.insertMany([
      { name: 'Hamburguesas', order: 0, active: true },
      { name: 'Pizzas', order: 1, active: true },
      { name: 'Lomitos', order: 2, active: true },
      { name: 'Papas', order: 3, active: true },
      { name: 'Bebidas', order: 4, active: true },
      { name: 'Combos', order: 5, active: true },
    ]);
    console.log(`${categories.length} categories created`);

    const products = await ProductModel.insertMany([
      {
        title: 'Hamburguesa Completa',
        description: 'Con lechuga, tomate, cebolla y queso cheddar',
        price: 1500,
        category: categories[0]._id,
        active: true,
        controlStock: false,
        stock: 0,
        image: 'https://via.placeholder.com/300x300?text=Hamburguesa+Completa',
      },
      {
        title: 'Hamburguesa Doble',
        description: 'Doble carne con queso y salsa especial',
        price: 2200,
        category: categories[0]._id,
        active: true,
        controlStock: false,
        stock: 0,
        image: 'https://via.placeholder.com/300x300?text=Hamburguesa+Doble',
      },
      {
        title: 'Hamburguesa Pollo',
        description: 'Pechuga de pollo crujiente con salsas',
        price: 1800,
        category: categories[0]._id,
        active: true,
        controlStock: false,
        stock: 0,
        image: 'https://via.placeholder.com/300x300?text=Hamburguesa+Pollo',
      },
      {
        title: 'Pizza Mozzarella Chica',
        description: 'Masa crocante con mozzarella fresca',
        price: 2000,
        category: categories[1]._id,
        active: true,
        controlStock: false,
        stock: 0,
        image: 'https://via.placeholder.com/300x300?text=Pizza+Mozzarella',
      },
      {
        title: 'Pizza Especial Chica',
        description: 'Jamón, queso, cebolla y orégano',
        price: 2500,
        category: categories[1]._id,
        active: true,
        controlStock: false,
        stock: 0,
        image: 'https://via.placeholder.com/300x300?text=Pizza+Especial',
      },
      {
        title: 'Pizza 4 Quesos Grande',
        description: 'Cuatro tipos de queso seleccionados',
        price: 3500,
        category: categories[1]._id,
        active: true,
        controlStock: false,
        stock: 0,
        image: 'https://via.placeholder.com/300x300?text=Pizza+4+Quesos',
      },
      {
        title: 'Lomito Completo',
        description: 'Carne, cebolla, lechuga y tomate',
        price: 1900,
        category: categories[2]._id,
        active: true,
        controlStock: false,
        stock: 0,
        image: 'https://via.placeholder.com/300x300?text=Lomito+Completo',
      },
      {
        title: 'Lomito Especial',
        description: 'Con salsa especial, queso y huevo frito',
        price: 2300,
        category: categories[2]._id,
        active: true,
        controlStock: false,
        stock: 0,
        image: 'https://via.placeholder.com/300x300?text=Lomito+Especial',
      },
      {
        title: 'Papas Clásicas',
        description: 'Papas fritas crocantes',
        price: 800,
        category: categories[3]._id,
        active: true,
        controlStock: false,
        stock: 0,
        image: 'https://via.placeholder.com/300x300?text=Papas+Clasicas',
      },
      {
        title: 'Papas con Cheddar',
        description: 'Papas con salsa de queso cheddar',
        price: 1100,
        category: categories[3]._id,
        active: true,
        controlStock: false,
        stock: 0,
        image: 'https://via.placeholder.com/300x300?text=Papas+Cheddar',
      },
      {
        title: 'Papas con Bacon',
        description: 'Papas crujientes con panceta y cheddar',
        price: 1300,
        category: categories[3]._id,
        active: true,
        controlStock: false,
        stock: 0,
        image: 'https://via.placeholder.com/300x300?text=Papas+Bacon',
      },
      {
        title: 'Coca Cola 500ml',
        description: 'Refrescante bebida cola',
        price: 600,
        category: categories[4]._id,
        active: true,
        controlStock: false,
        stock: 0,
        image: 'https://via.placeholder.com/300x300?text=Coca+Cola',
      },
      {
        title: 'Agua 500ml',
        description: 'Agua mineral fría',
        price: 300,
        category: categories[4]._id,
        active: true,
        controlStock: false,
        stock: 0,
        image: 'https://via.placeholder.com/300x300?text=Agua',
      },
      {
        title: 'Jugo Natural',
        description: 'Jugo natural de naranja o pomelo',
        price: 1200,
        category: categories[4]._id,
        active: true,
        controlStock: false,
        stock: 0,
        image: 'https://via.placeholder.com/300x300?text=Jugo+Natural',
      },
      {
        title: 'Combo Completo',
        description: '2 Hamburguesas + Papas + Bebida',
        price: 3800,
        category: categories[5]._id,
        active: true,
        controlStock: false,
        stock: 0,
        image: 'https://via.placeholder.com/300x300?text=Combo+Completo',
      },
    ]);
    console.log(`${products.length} products created`);

    const additionals = await AdicionalModel.insertMany([
      { title: 'Cheddar Extra', price: 200, active: true },
      { title: 'Panceta', price: 400, active: true },
      { title: 'Doble Carne', price: 600, active: true },
      { title: 'Huevo Frito', price: 300, active: true },
      { title: 'Salsa Especial', price: 150, active: true },
      { title: 'Cebolla Caramelizada', price: 250, active: true },
      { title: 'Tomate Extra', price: 100, active: true },
      { title: 'Lechuga Extra', price: 100, active: true },
    ]);
    console.log(`${additionals.length} additionals created`);

    await ConfigModel.create({
      isOpen: true,
      isEmergencyClosed: false,
      emergencyMessage: '',
      banner: 'https://via.placeholder.com/1200x300?text=Cheepers',
      isAllClose: false,
      dailySchedule: [
        { day: 'Lunes', openTime: '09:00', closeTime: '23:00', isStoreOpen: true },
        { day: 'Martes', openTime: '09:00', closeTime: '23:00', isStoreOpen: true },
        { day: 'Miércoles', openTime: '09:00', closeTime: '23:00', isStoreOpen: true },
        { day: 'Jueves', openTime: '09:00', closeTime: '23:00', isStoreOpen: true },
        { day: 'Viernes', openTime: '09:00', closeTime: '00:00', isStoreOpen: true },
        { day: 'Sábado', openTime: '09:00', closeTime: '00:00', isStoreOpen: true },
        { day: 'Domingo', openTime: '09:00', closeTime: '23:00', isStoreOpen: true },
      ],
    });
    console.log('Config created');

    await BannerModel.insertMany([
      {
        title: 'Hamburguesas en promocion',
        description: 'Lleva 2 y pagas 3.800 pesos',
        image: 'https://via.placeholder.com/1200x400?text=Promo+Hamburguesas',
        order: 0,
        active: true,
      },
      {
        title: 'Pizzas especiales',
        description: 'Grandes a precio de chica este fin de semana',
        image: 'https://via.placeholder.com/1200x400?text=Promo+Pizzas',
        order: 1,
        active: true,
      },
      {
        title: 'Bebidas gratis',
        description: 'En la compra de un combo',
        image: 'https://via.placeholder.com/1200x400?text=Promo+Bebidas',
        order: 2,
        active: true,
      },
    ]);
    console.log('Banners created');

    await User.create({
      email: 'admin@cheepers.com',
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
