// Cleanup script to delete files from completed orders
import { Order } from '../src/models/index.js';
import fs from 'fs/promises';
import path from 'path';

async function cleanupCompletedOrderFiles() {
  try {
    console.log('🧹 Starting cleanup of files from completed orders...');
    
    // Find all completed orders
    const completedOrders = await Order.findAll({
      where: { status: 'completed' },
      attributes: ['id', 'files']
    });
    
    console.log(`📊 Found ${completedOrders.length} completed orders`);
    
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const order of completedOrders) {
      if (!order.files) continue;
      
      try {
        // Parse files if they're stored as JSON string
        let filesToDelete = [];
        if (typeof order.files === 'string') {
          filesToDelete = JSON.parse(order.files);
        } else if (Array.isArray(order.files)) {
          filesToDelete = order.files;
        }
        
        console.log(`🗑️  Processing ${filesToDelete.length} files for order ${order.id}`);
        
        for (const file of filesToDelete) {
          try {
            let filePath;
            
            if (file.path && file.path.startsWith('uploads/')) {
              filePath = path.join(process.cwd(), file.path);
            } else if (file.filename) {
              filePath = path.join(process.cwd(), 'uploads', file.filename);
            } else if (file.path) {
              filePath = path.join(process.cwd(), 'uploads', file.path);
            } else {
              console.log(`❌ No valid file path for file:`, file);
              continue;
            }
            
            // Check if file exists before trying to delete
            try {
              await fs.access(filePath);
              await fs.unlink(filePath);
              console.log(`✅ Deleted: ${filePath}`);
              deletedCount++;
            } catch (accessError) {
              if (accessError.code === 'ENOENT') {
                console.log(`⚠️  File already deleted: ${filePath}`);
              } else {
                throw accessError;
              }
            }
          } catch (fileError) {
            console.error(`❌ Failed to delete file:`, fileError.message);
            errorCount++;
          }
        }
      } catch (parseError) {
        console.error(`❌ Failed to parse files for order ${order.id}:`, parseError.message);
        errorCount++;
      }
    }
    
    console.log('\n📈 Cleanup Summary:');
    console.log(`✅ Files deleted: ${deletedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📋 Completed orders processed: ${completedOrders.length}`);
    
  } catch (error) {
    console.error('💥 Cleanup script failed:', error);
  }
}

// Run the cleanup
cleanupCompletedOrderFiles()
  .then(() => {
    console.log('\n🎉 Cleanup completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Cleanup failed:', error);
    process.exit(1);
  });