/**
 * STORAGE INTERFACE FOR REPLIT DATABASE INTEGRATION
 * This file provides the interface that Replit's javascript_database integration expects
 * It maps to our Sequelize models behind the scenes
 */

// Import our actual Sequelize models
import { sequelize } from '../src/config/database.js';

// Mock storage interface that Replit expects
export interface IStorage {
  // QR Scans
  getQRScans(): Promise<any[]>;
  getQRScan(id: number): Promise<any>;
  createQRScan(data: any): Promise<any>;
  
  // Users
  getUsers(): Promise<any[]>;
  getUser(id: number): Promise<any>;
  createUser(data: any): Promise<any>;
  updateUser(id: number, data: any): Promise<any>;
  
  // Shops
  getShops(): Promise<any[]>;
  getShop(id: number): Promise<any>;
  createShop(data: any): Promise<any>;
  updateShop(id: number, data: any): Promise<any>;
  
  // Orders
  getOrders(): Promise<any[]>;
  getOrder(id: number): Promise<any>;
  createOrder(data: any): Promise<any>;
  updateOrder(id: number, data: any): Promise<any>;
}

// Implementation that uses Sequelize models
class SequelizeStorage implements IStorage {
  async getQRScans() {
    const [results] = await sequelize.query('SELECT * FROM qr_scans');
    return results;
  }
  
  async getQRScan(id: number) {
    const [results] = await sequelize.query('SELECT * FROM qr_scans WHERE id = :id', {
      replacements: { id }
    });
    return results[0];
  }
  
  async createQRScan(data: any) {
    const [result] = await sequelize.query(
      'INSERT INTO qr_scans (customer_id, shop_id, resulted_in_unlock, scan_location) VALUES (:customer_id, :shop_id, :resulted_in_unlock, :scan_location) RETURNING *',
      { replacements: data }
    );
    return result[0];
  }
  
  async getUsers() {
    const [results] = await sequelize.query('SELECT * FROM users');
    return results;
  }
  
  async getUser(id: number) {
    const [results] = await sequelize.query('SELECT * FROM users WHERE id = :id', {
      replacements: { id }
    });
    return results[0];
  }
  
  async createUser(data: any) {
    const [result] = await sequelize.query(
      'INSERT INTO users (phone, name, email, role) VALUES (:phone, :name, :email, :role) RETURNING *',
      { replacements: data }
    );
    return result[0];
  }
  
  async updateUser(id: number, data: any) {
    const setClause = Object.keys(data).map(key => `${key} = :${key}`).join(', ');
    const [result] = await sequelize.query(
      `UPDATE users SET ${setClause} WHERE id = :id RETURNING *`,
      { replacements: { ...data, id } }
    );
    return result[0];
  }
  
  async getShops() {
    const [results] = await sequelize.query('SELECT * FROM shops');
    return results;
  }
  
  async getShop(id: number) {
    const [results] = await sequelize.query('SELECT * FROM shops WHERE id = :id', {
      replacements: { id }
    });
    return results[0];
  }
  
  async createShop(data: any) {
    const [result] = await sequelize.query(
      'INSERT INTO shops (name, slug, email, owner_id) VALUES (:name, :slug, :email, :owner_id) RETURNING *',
      { replacements: data }
    );
    return result[0];
  }
  
  async updateShop(id: number, data: any) {
    const setClause = Object.keys(data).map(key => `${key} = :${key}`).join(', ');
    const [result] = await sequelize.query(
      `UPDATE shops SET ${setClause} WHERE id = :id RETURNING *`,
      { replacements: { ...data, id } }
    );
    return result[0];
  }
  
  async getOrders() {
    const [results] = await sequelize.query('SELECT * FROM orders');
    return results;
  }
  
  async getOrder(id: number) {
    const [results] = await sequelize.query('SELECT * FROM orders WHERE id = :id', {
      replacements: { id }
    });
    return results[0];
  }
  
  async createOrder(data: any) {
    const [result] = await sequelize.query(
      'INSERT INTO orders (customer_id, shop_id, order_type, status) VALUES (:customer_id, :shop_id, :order_type, :status) RETURNING *',
      { replacements: data }
    );
    return result[0];
  }
  
  async updateOrder(id: number, data: any) {
    const setClause = Object.keys(data).map(key => `${key} = :${key}`).join(', ');
    const [result] = await sequelize.query(
      `UPDATE orders SET ${setClause} WHERE id = :id RETURNING *`,
      { replacements: { ...data, id } }
    );
    return result[0];
  }
}

// Export storage instance
export const storage = new SequelizeStorage();

// Also export as default for Replit compatibility
export default storage;

console.log('✅ Storage interface created for Replit database integration');
console.log('✅ Maps to Sequelize models internally');