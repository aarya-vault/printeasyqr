const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'orders',
      key: 'id'
    },
    field: 'order_id'
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    field: 'sender_id'
  },
  senderName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'sender_name'
  },
  senderRole: {
    type: DataTypes.ENUM('customer', 'shop_owner', 'admin'),
    allowNull: false,
    field: 'sender_role'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: ''
  },
  files: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  messageType: {
    type: DataTypes.ENUM('text', 'file', 'system'),
    allowNull: false,
    defaultValue: 'text',
    field: 'message_type'
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_read'
  }
}, {
  tableName: 'messages',
  timestamps: true,
  underscored: true,
  updatedAt: false
});

module.exports = Message;