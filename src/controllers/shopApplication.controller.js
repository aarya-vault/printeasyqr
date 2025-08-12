import { ShopApplication, Shop, User, sequelize } from '../models/index.js';
import { Op } from 'sequelize';
import bcrypt from 'bcrypt';

class ShopApplicationController {
  // Create shop application
  static async createApplication(req, res) {
    const transaction = await sequelize.transaction();
    
    try {
      const applicationData = req.body;
      
      // Check if email or slug already exists
      const existingApp = await ShopApplication.findOne({
        where: {
          [Op.or]: [
            { email: applicationData.email },
            { shopSlug: applicationData.shopSlug }
          ]
        }
      });
      
      if (existingApp) {
        if (existingApp.email === applicationData.email) {
          return res.status(400).json({ message: 'An application with this email already exists' });
        }
        if (existingApp.shopSlug === applicationData.shopSlug) {
          return res.status(400).json({ message: 'This shop URL is already taken. Please choose a different one.' });
        }
      }
      
      // Check if shop slug is already in use
      const existingShop = await Shop.findOne({
        where: { slug: applicationData.shopSlug }
      });
      
      if (existingShop) {
        return res.status(400).json({ message: 'This shop URL is already taken.' });
      }
      
      // 🔥 ROBUST PHONE CONFLICT PREVENTION: Check for conflicts before creating applicant
      let applicant = await User.findOne({
        where: { phone: applicationData.phoneNumber }
      });
      
      if (applicant) {
        // If user already exists as shop owner, prevent duplicate application
        if (applicant.role === 'shop_owner') {
          await transaction.rollback();
          return res.status(400).json({ 
            message: 'This phone number is already registered as a shop owner. Each phone number can only be associated with one shop.',
            errorCode: 'PHONE_ALREADY_SHOP_OWNER'
          });
        }
        
        // If user is admin, prevent shop application
        if (applicant.role === 'admin') {
          await transaction.rollback();
          return res.status(400).json({ 
            message: 'Admin accounts cannot apply for shop ownership.',
            errorCode: 'ADMIN_CANNOT_APPLY'
          });
        }
        
        // If user is customer, check if they already have pending/approved application
        const existingApplication = await ShopApplication.findOne({
          where: { 
            applicantId: applicant.id,
            status: { [Op.in]: ['pending', 'approved'] }
          }
        });
        
        if (existingApplication) {
          await transaction.rollback();
          return res.status(400).json({ 
            message: 'You already have a shop application that is pending or approved.',
            errorCode: 'APPLICATION_ALREADY_EXISTS',
            existingApplicationStatus: existingApplication.status
          });
        }
      } else {
        // Create new user only if no conflicts found
        applicant = await User.create({
          phone: applicationData.phoneNumber,
          name: applicationData.ownerFullName,
          role: 'customer', // Start as customer, will be upgraded when approved
          isActive: true
        }, { transaction });
      }
      
      // Create application
      const application = await ShopApplication.create({
        ...applicationData,
        applicantId: applicant.id
      }, { transaction });
      
      await transaction.commit();
      
      res.json(application);
    } catch (error) {
      await transaction.rollback();
      console.error('Create shop application error:', error);
      res.status(500).json({ message: 'Failed to submit application' });
    }
  }

  // Get all applications (admin)
  static async getAllApplications(req, res) {
    try {
      const applications = await ShopApplication.findAll({
        include: [{ model: User, as: 'applicant' }],
        order: [['createdAt', 'DESC']]
      });
      
      // Transform data to match frontend expectations with complete field mapping
      const transformedApplications = applications.map(app => ({
        id: app.id,
        // Public Information
        shopName: app.publicShopName,
        publicShopName: app.publicShopName,
        publicOwnerName: app.publicOwnerName,
        publicAddress: app.publicAddress,
        publicContactNumber: app.publicContactNumber,
        shopSlug: app.shopSlug,
        // Internal Information
        internalShopName: app.internalShopName,
        ownerFullName: app.ownerFullName,
        applicantName: app.ownerFullName,
        email: app.email,
        phoneNumber: app.phoneNumber,
        completeAddress: app.completeAddress,
        // Location
        city: app.city,
        state: app.state,
        pinCode: app.pinCode,
        // Business Information
        services: app.services || [],
        customServices: app.customServices || [],
        equipment: app.equipment || [],
        customEquipment: app.customEquipment || [],
        yearsOfExperience: app.yearsOfExperience,
        formationYear: app.formationYear,
        // Working Hours and Settings
        workingHours: app.workingHours,
        acceptsWalkinOrders: app.acceptsWalkinOrders,
        // Admin
        status: app.status,
        adminNotes: app.adminNotes,
        createdAt: app.createdAt,
        updatedAt: app.updatedAt,
        applicant: app.applicant
      }));
      
      res.json(transformedApplications);
    } catch (error) {
      console.error('Error fetching applications:', error);
      res.status(500).json({ message: 'Failed to fetch applications' });
    }
  }

  // Update application status (admin)
  static async updateApplicationStatus(req, res) {
    const transaction = await sequelize.transaction();
    
    try {
      const applicationId = parseInt(req.params.id);
      const { status, adminNotes } = req.body;
      
      const application = await ShopApplication.findByPk(applicationId, {
        include: [{ model: User, as: 'applicant' }]
      });
      
      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }
      
      await application.update({ status, adminNotes }, { transaction });
      
      // If approved, create shop and owner account
      if (status === 'approved') {
        // 🔥 COMPREHENSIVE APPROVAL CONFLICT RESOLUTION
        let owner = await User.findOne({
          where: { phone: application.phoneNumber },
          transaction
        });
        
        if (owner) {
          // Double-check: Ensure we're not trying to convert an existing shop owner
          if (owner.role === 'shop_owner') {
            await transaction.rollback();
            return res.status(400).json({ 
              message: 'Cannot approve application: Phone number already belongs to an existing shop owner.',
              errorCode: 'PHONE_CONFLICT_ON_APPROVAL'
            });
          }
          
          // Ensure we're not converting admin accounts
          if (owner.role === 'admin') {
            await transaction.rollback();
            return res.status(400).json({ 
              message: 'Cannot approve application: Phone number belongs to admin account.',
              errorCode: 'ADMIN_CONFLICT_ON_APPROVAL'
            });
          }
          
          // Update existing customer to shop owner (let model handle password hashing)
          await owner.update({
            email: application.email,
            name: application.ownerFullName,
            passwordHash: application.password, // Model will hash this automatically
            role: 'shop_owner',
            isActive: true
          }, { transaction });
        } else {
          // This should rarely happen since applicant was created during application
          // But create new shop owner as fallback (let model handle password hashing)
          owner = await User.create({
            phone: application.phoneNumber,
            email: application.email,
            name: application.ownerFullName,
            passwordHash: application.password, // Model will hash this automatically
            role: 'shop_owner',
            isActive: true
          }, { transaction });
        }
        
        // 🔥 COMPREHENSIVE SHOP CREATION - PRESERVING CUSTOM SERVICES/EQUIPMENT
        // Keep standard and custom services separate
        const standardServices = Array.isArray(application.services) ? application.services.filter(s => s && s.trim() !== '') : [];
        const customServices = Array.isArray(application.customServices) ? application.customServices.filter(s => s && s.trim() !== '') : [];
        
        // Keep standard and custom equipment separate  
        const standardEquipment = Array.isArray(application.equipment) ? application.equipment.filter(e => e && e.trim() !== '') : [];
        const customEquipment = Array.isArray(application.customEquipment) ? application.customEquipment.filter(e => e && e.trim() !== '') : [];

        console.log('🔧 Creating shop with separate custom data:', {
          name: application.publicShopName,
          services: standardServices,
          customServices: customServices,
          equipment: standardEquipment,
          customEquipment: customEquipment,
          workingHours: application.workingHours,
          yearsOfExperience: application.yearsOfExperience
        });

        // Create shop with COMPLETE data mapping
        const shop = await Shop.create({
          ownerId: owner.id,
          // Public info
          name: application.publicShopName,
          slug: application.shopSlug,
          address: application.publicAddress,
          city: application.city || application.publicAddress?.split(',')[1]?.trim() || 'Not specified',
          state: application.state || application.publicAddress?.split(',')[2]?.trim() || 'Not specified',
          pinCode: application.pinCode,
          phone: application.publicContactNumber || application.phoneNumber,
          publicOwnerName: application.publicOwnerName,
          // Internal info
          internalName: application.internalShopName,
          ownerFullName: application.ownerFullName,
          email: application.email,
          ownerPhone: application.phoneNumber,
          completeAddress: application.completeAddress || application.publicAddress,
          // 🔥 CRITICAL FIX: Separate standard and custom services/equipment
          services: standardServices,
          equipment: standardEquipment,
          customServices: customServices,
          customEquipment: customEquipment,
          // 🔥 CRITICAL FIX: Proper years of experience mapping
          yearsOfExperience: application.yearsOfExperience || (application.formationYear ? (new Date().getFullYear() - application.formationYear).toString() : '0'),
          formationYear: application.formationYear,
          // 🔥 CRITICAL FIX: Ensure working hours is proper JSON
          workingHours: typeof application.workingHours === 'string' 
            ? JSON.parse(application.workingHours) 
            : application.workingHours,
          acceptsWalkinOrders: application.acceptsWalkinOrders !== undefined ? application.acceptsWalkinOrders : true,
          // Google Maps Link
          googleMapsLink: application.googleMapsLink || null,
          // Status
          isApproved: true,
          isPublic: true,
          status: 'active'
        }, { transaction });
      }
      
      await transaction.commit();
      
      console.log(`✅ Application ${applicationId} ${status} successfully`);
      if (status === 'approved') {
        console.log(`✅ Shop created for application ${applicationId}`);
      }
      
      res.json({ 
        success: true, 
        message: `Application ${status}`,
        application 
      });
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Update application error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        applicationId,
        status
      });
      res.status(500).json({ message: 'Failed to update application', error: error.message });
    }
  }

  // Get single application
  static async getApplication(req, res) {
    try {
      const applicationId = parseInt(req.params.id);
      const application = await ShopApplication.findByPk(applicationId, {
        include: [{ model: User, as: 'applicant' }]
      });
      
      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }
      
      res.json(application);
    } catch (error) {
      console.error('Get application error:', error);
      res.status(500).json({ message: 'Failed to get application' });
    }
  }

  // Update entire application (admin)
  static async updateApplication(req, res) {
    const transaction = await sequelize.transaction();
    
    try {
      const applicationId = parseInt(req.params.id);
      const updatedData = req.body;
      
      const application = await ShopApplication.findByPk(applicationId, { transaction });
      
      if (!application) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Application not found' });
      }

      // Check if email or slug conflicts with other applications (excluding current one)
      if (updatedData.email !== application.email || updatedData.shopSlug !== application.shopSlug) {
        const existingApp = await ShopApplication.findOne({
          where: {
            id: { [Op.ne]: applicationId },
            [Op.or]: [
              { email: updatedData.email },
              { shopSlug: updatedData.shopSlug }
            ]
          },
          transaction
        });
        
        if (existingApp) {
          await transaction.rollback();
          if (existingApp.email === updatedData.email) {
            return res.status(400).json({ message: 'An application with this email already exists' });
          }
          if (existingApp.shopSlug === updatedData.shopSlug) {
            return res.status(400).json({ message: 'This shop URL is already taken. Please choose a different one.' });
          }
        }

        // Check if shop slug is already in use by an existing shop
        const existingShop = await Shop.findOne({
          where: { slug: updatedData.shopSlug },
          transaction
        });
        
        if (existingShop) {
          await transaction.rollback();
          return res.status(400).json({ message: 'This shop URL is already taken by an existing shop.' });
        }
      }
      
      // Update the application
      await application.update(updatedData, { transaction });
      
      await transaction.commit();
      
      // Fetch updated application with associations
      const updatedApplication = await ShopApplication.findByPk(applicationId, {
        include: [{ model: User, as: 'applicant' }]
      });
      
      res.json({ 
        success: true, 
        message: 'Application updated successfully',
        application: updatedApplication
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Update application error:', error);
      res.status(500).json({ message: 'Failed to update application' });
    }
  }
}

export default ShopApplicationController;