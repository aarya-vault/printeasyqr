// Download routes for file access from object storage
import { Router } from 'express';
import { ObjectStorageService } from '../server/objectStorage.js';
import requireAuth from '../middleware/auth.js';

const router = Router();
const objectStorage = new ObjectStorageService();

// Download file from object storage
router.get('/download/*', requireAuth, async (req, res) => {
  try {
    // Get the file path from the URL
    const filePath = req.params[0];
    const originalName = req.query.originalName || 'download';
    
    console.log('📥 Download request for:', filePath);
    
    // Construct the full object path
    let objectPath = filePath;
    if (!objectPath.startsWith('/objects/')) {
      objectPath = `/objects/${filePath}`;
    }
    
    // Stream the file from object storage
    const stream = await objectStorage.getFileStream(objectPath);
    
    if (!stream) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
    
    // Pipe the stream to response
    stream.pipe(res);
    
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ message: 'Failed to download file' });
  }
});

export default router;