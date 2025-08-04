import express from 'express';

const router = express.Router();

// Test endpoint to debug session issues
router.get('/session-test', (req, res) => {
  res.json({
    sessionID: req.sessionID,
    hasSession: !!req.session,
    sessionData: req.session,
    cookies: req.cookies,
    headers: {
      cookie: req.headers.cookie,
      origin: req.headers.origin,
      referer: req.headers.referer
    },
    sessionCookie: req.session?.cookie
  });
});

router.post('/session-test-set', (req, res) => {
  req.session.testData = {
    timestamp: new Date().toISOString(),
    value: 'test-value'
  };
  
  req.session.save((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to save session', details: err.message });
    }
    
    res.json({
      message: 'Session data set',
      sessionID: req.sessionID,
      sessionData: req.session
    });
  });
});

export default router;