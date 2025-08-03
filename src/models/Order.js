const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    field: 'customer_id'
  },
  shopId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'shops',
      key: 'id'
    },
    field: 'shop_id'
  },
  orderNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'order_number'
  },
  type: {
    type: DataTypes.ENUM('upload', 'walkin'),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  specifications: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  files: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  walkinTime: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'walkin_time'
  },
  status: {
    type: DataTypes.ENUM('new', 'processing', 'ready', 'completed'),
    allowNull: false,
    defaultValue: 'new'
  },
  isUrgent: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_urgent'
  },
  estimatedPages: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'estimated_pages'
  },
  estimatedBudget: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'estimated_budget'
  },
  finalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'final_amount'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  deletedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    field: 'deleted_by'
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'deleted_at'
  }
}, {
  tableName: 'orders',
  timestamps: true,
  underscored: true,
  paranoid: false // We're using custom soft delete
});

module.exports = Order;