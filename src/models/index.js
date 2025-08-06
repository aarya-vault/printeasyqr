import { sequelize } from '../config/database.js';
import User from './User.js';
import Shop from './Shop.js';
import Order from './Order.js';
import Message from './Message.js';
import CustomerShopUnlock from './CustomerShopUnlock.js';
import ShopApplication from './ShopApplication.js';
import Notification from './Notification.js';
import ShopUnlock from './ShopUnlock.js';
import QRScan from './QRScan.js';

// Define associations
const defineAssociations = () => {
  // User associations
  User.hasMany(Shop, { as: 'ownedShops', foreignKey: 'ownerId' });
  User.hasMany(Order, { as: 'orders', foreignKey: 'customerId' });
  User.hasMany(Message, { as: 'messages', foreignKey: 'senderId' });
  User.hasMany(Notification, { as: 'notifications', foreignKey: 'userId' });
  User.hasMany(ShopApplication, { as: 'applications', foreignKey: 'applicantId' });
  User.belongsToMany(Shop, {
    through: CustomerShopUnlock,
    as: 'unlockedShops',
    foreignKey: 'customerId',
    otherKey: 'shopId'
  });

  // Shop associations
  Shop.belongsTo(User, { as: 'owner', foreignKey: 'ownerId' });
  Shop.hasMany(Order, { as: 'orders', foreignKey: 'shopId' });
  Shop.belongsToMany(User, {
    through: CustomerShopUnlock,
    as: 'customers',
    foreignKey: 'shopId',
    otherKey: 'customerId'
  });

  // Order associations
  Order.belongsTo(User, { as: 'customer', foreignKey: 'customerId' });
  Order.belongsTo(Shop, { as: 'shop', foreignKey: 'shopId' });
  Order.belongsTo(User, { as: 'deletedByUser', foreignKey: 'deletedBy' });
  Order.hasMany(Message, { as: 'messages', foreignKey: 'orderId' });

  // Message associations
  Message.belongsTo(Order, { as: 'order', foreignKey: 'orderId' });
  Message.belongsTo(User, { as: 'sender', foreignKey: 'senderId' });

  // CustomerShopUnlock associations
  CustomerShopUnlock.belongsTo(User, { as: 'customer', foreignKey: 'customerId' });
  CustomerShopUnlock.belongsTo(Shop, { as: 'shop', foreignKey: 'shopId' });

  // ShopApplication associations
  ShopApplication.belongsTo(User, { as: 'applicant', foreignKey: 'applicantId' });

  // Notification associations
  Notification.belongsTo(User, { as: 'user', foreignKey: 'userId' });

  // ShopUnlock associations
  ShopUnlock.belongsTo(User, { as: 'customer', foreignKey: 'customerId' });
  ShopUnlock.belongsTo(Shop, { as: 'shop', foreignKey: 'shopId' });

  // QRScan associations
  QRScan.belongsTo(User, { as: 'customer', foreignKey: 'customerId' });
  QRScan.belongsTo(Shop, { as: 'shop', foreignKey: 'shopId' });
};

// Initialize associations
defineAssociations();

// Sync database (in development only)
const syncDatabase = async (force = false) => {
  try {
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ force, alter: !force });
      console.log('Database synchronized successfully.');
    }
  } catch (error) {
    console.error('Database synchronization failed:', error);
  }
};

export {
  sequelize,
  User,
  Shop,
  Order,
  Message,
  CustomerShopUnlock,
  ShopApplication,
  Notification,
  ShopUnlock,
  QRScan,
  syncDatabase
};