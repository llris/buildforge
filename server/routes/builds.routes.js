const express = require('express');
const router = express.Router();
const buildsController = require('../controllers/builds.controller');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth); // All routes below require auth

router.route('/')
  .post(buildsController.createBuild)
  .get(buildsController.getMyBuilds);

router.route('/:id')
  .get(buildsController.getBuild)
  .put(buildsController.updateBuild)
  .delete(buildsController.deleteBuild);

module.exports = router;
