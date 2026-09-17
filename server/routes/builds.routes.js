const express = require('express');
const router = express.Router();
const buildsController = require('../controllers/builds.controller');
const { requireAuth } = require('../middleware/auth');

// ====================================================
// PUBLIC ROUTES (No auth required)
// ====================================================
router.get('/gallery', buildsController.getGalleryBuilds);
router.get('/shared/:shareId', buildsController.getSharedBuild);

// ====================================================
// AUTHENTICATED USER ROUTES
// ====================================================
router.post('/shared/:shareId/clone', requireAuth, buildsController.cloneSharedBuild);

router.route('/')
  .post(requireAuth, buildsController.createBuild)
  .get(requireAuth, buildsController.getMyBuilds);

router.post('/:id/share', requireAuth, buildsController.shareBuild);

router.route('/:id')
  .get(requireAuth, buildsController.getBuild)
  .put(requireAuth, buildsController.updateBuild)
  .delete(requireAuth, buildsController.deleteBuild);

module.exports = router;
