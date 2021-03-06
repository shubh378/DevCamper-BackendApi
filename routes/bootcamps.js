const express = require('express');
const {getBootcamps,getBootcamp,createBootcamp,updateBootcamp,deleteBootcamp,getBootcampsInRadius,bootcampPhotoUpload} = require('../controllers/bootcamps');
//const { route } = require('./courses');
//Include other resource routers
const Bootcamp =  require('../models/Bootcamp');
const advancedResults = require('../middleware/advancedResults');


const courseRouter = require('./courses');
const reviewRouter = require('./reviews');

const router = express.Router();

const { protect,authorize } = require('../middleware/auth');

//re-route into resource router
router.use('/:bootcampId/courses',courseRouter);
router.use('/:bootcampId/reviews',reviewRouter);

//it is going to route /api/v1/bootcamps
router.route('/radius/:zipcode/:distance')
.get(getBootcampsInRadius);

router.route('/:id/photo')
.put(protect,authorize('publisher','admin'),bootcampPhotoUpload);

router.route('/')
.get(advancedResults(Bootcamp,'courses'),getBootcamps)
.post(protect,authorize('publisher','admin'),createBootcamp);

router.route('/:id')
.get(getBootcamp)
.delete(protect,authorize('publisher','admin'),deleteBootcamp)
.put(protect,authorize('publisher','admin'),updateBootcamp);

module.exports = router;