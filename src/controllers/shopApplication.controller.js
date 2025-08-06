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
      
      // Create or find applicant user
      let applicant = await User.findOne({
        where: { phone: applicationData.phoneNumber }
      });
      
      if (!applicant) {
        applicant = await User.create({
          phone: applicationData.phoneNumber,
          name: applicationData.ownerFullName,
          role: 'customer'
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
      
      // Transform data to match frontend expectations
      const transformedApplications = applications.map(app => ({
        id: app.id,
        shopName: app.publicShopName,
        shopSlug: app.shopSlug,
        applicantName: app.ownerFullName,
        email: app.email,
        phoneNumber: app.phoneNumber,
        city: app.city,
        state: app.state,
        pinCode: app.pinCode,
        services: app.services,
        customServices: app.customServices,
        equipment: app.equipment,
        customEquipment: app.customEquipment,
        yearsOfExperience: app.yearsOfExperience,
        formationYear: app.formationYear,
        workingHours: app.workingHours,
        acceptsWalkinOrders: app.acceptsWalkinOrders,
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
        // 🔥 PHONE CONFLICT RESOLUTION: Check for existing user with same phone
        let owner = await User.findOne({
          where: { phone: application.phoneNumber },
          transaction
        });
        
        if (owner) {
          // Update existing user to shop owner (let model handle password hashing)
          await owner.update({
            email: application.email,
            name: application.ownerFullName,
            passwordHash: application.password, // Model will hash this automatically
            role: 'shop_owner',
            isActive: true
          }, { transaction });
        } else {
          // Create new shop owner (let model handle password hashing)
          owner = await User.create({
            phone: application.phoneNumber,
            email: application.email,
            name: application.ownerFullName,
            passwordHash: application.password, // Model will hash this automatically
            role: 'shop_owner',
            isActive: true
          }, { transaction });
        }
        
        // Create shop
        const shop = await Shop.create({
          ownerId: owner.id,
          // Public info
          name: application.publicShopName,
          slug: application.shopSlug,
          address: application.publicAddress,
          city: application.city,
          state: application.state,
          pinCode: application.pinCode,
          phone: application.publicContactNumber || application.phoneNumber,
          publicOwnerName: application.publicOwnerName,
          // Internal info
          internalName: application.internalShopName,
          ownerFullName: application.ownerFullName,
          email: application.email,
          ownerPhone: application.phoneNumber,
          completeAddress: application.completeAddress || application.publicAddress,
          // Services
          services: application.services,
          equipment: application.equipment,
          yearsOfExperience: application.yearsOfExperience, // Keep for backward compatibility
          formationYear: application.formationYear,
          workingHours: application.workingHours,
          acceptsWalkinOrders: application.acceptsWalkinOrders,
          // Status
          isApproved: true,
          isPublic: true,
          status: 'active'
        }, { transaction });
      }
      
      await transaction.commit();
      
      res.json({ 
        success: true, 
        message: `Application ${status}`,
        application 
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Update application error:', error);
      res.status(500).json({ message: 'Failed to update application' });
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