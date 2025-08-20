import { DataTypes } from 'sequelize';
import { getSequelize } from '../config/database.js';

const ShopUnlock = getSequelize().define('ShopUnlock', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'customer_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  shopId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'shop_id',
    references: {
      model: 'shops',
      key: 'id'
    }
  },
  unlockMethod: {
    type: DataTypes.ENUM('qr_scan', 'search', 'direct_link'),
    allowNull: false,
    defaultValue: 'qr_scan',
    field: 'unlock_method'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  }
}, {
  tableName: 'shop_unlocks',
  timestamps: false,
  indexes: [
    { fields: ['customer_id'] },
    { fields: ['shop_id'] },
    { fields: ['created_at'] }
  ]
});

export default ShopUnlock;