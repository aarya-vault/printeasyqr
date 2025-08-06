import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const ShopApplication = sequelize.define('ShopApplication', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  applicantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    field: 'applicant_id'
  },
  // Public Information
  publicShopName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'public_shop_name'
  },
  publicOwnerName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'public_owner_name'
  },
  publicAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'public_address'
  },
  publicContactNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'public_contact_number'
  },
  // Internal Details
  internalShopName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'internal_shop_name'
  },
  ownerFullName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'owner_full_name'
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'phone_number'
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  completeAddress: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'complete_address'
  },
  // Location
  city: {
    type: DataTypes.STRING,
    allowNull: false
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false
  },
  pinCode: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'pin_code'
  },
  // Business Details
  services: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  customServices: {
    type: DataTypes.JSONB,
    defaultValue: [],
    field: 'custom_services'
  },
  equipment: {
    type: DataTypes.JSONB,
    allowNull: true, // Equipment is now truly optional
    defaultValue: []
  },
  customEquipment: {
    type: DataTypes.JSONB,
    defaultValue: [],
    field: 'custom_equipment'
  },
  yearsOfExperience: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'years_of_experience'
  },
  // Working Hours
  workingHours: {
    type: DataTypes.JSONB,
    allowNull: false,
    field: 'working_hours'
  },
  acceptsWalkinOrders: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'accepts_walkin_orders'
  },
  // Application Status
  shopSlug: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'shop_slug'
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'pending'
  },
  adminNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'admin_notes'
  }
}, {
  tableName: 'shop_applications',
  timestamps: true,
  underscored: true
});

export default ShopApplication;