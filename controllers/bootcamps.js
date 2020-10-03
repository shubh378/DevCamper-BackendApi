const path = require('path');
const ErrorResponse =require('../utils/errorResponse');
//Bringing in model
const Bootcamp = require('../models/Bootcamp');
//async handler
const asyncHandler =require('../middleware/async.js');
const geocoder = require('../utils/geocoder');


//@desc    GET all bootcamps
//@routes  GET /api/v1/bootcamps
//@access  public
exports.getBootcamps = asyncHandler(async (req,res,next)=>{

     
        res.status(200).json(res.advancedResults);

});

//@desc    GET single bootcamps
//@routes  GET /api/v1/bootcamps/:id
//@access  public
exports.getBootcamp = asyncHandler(async (req,res,next)=>{
   
        const bootcamp = await Bootcamp.findById(req.params.id);

        if(!bootcamp)
        {
            return  next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`,404)); //here we need to return or else error  "Headers are aldready set"
        }

        res.status(200).json({success: true, data: bootcamp});

   
});

//@desc    create new bootcamps
//@routes  POST /api/v1/bootcamps/:id
//@access  private
exports.createBootcamp = asyncHandler(async (req,res,next) =>{
    
    //Add user to req.body
    req.body.user = req.user.id;
    
    //Check for published bootcamp
    const publishedBootcamp = await Bootcamp.findOne({user : req.user.id});

    //if the user is not an an admin, they can only one add one bootcamp
    if(publishedBootcamp && req.user.role!=='admin'){
        return next(new ErrorResponse(`The user with ID ${req.user.id} has already published a bootcamp`,400));
        

    }

    //If the user is not an admin
    const bootcamp = await Bootcamp.create(req.body);//all the data put will be put in our database,thats how we put a field which is not in our schema will not be added
    res.status(201).json({
        success: true,
        data:bootcamp
    });  
});

//@desc    Update bootcamps
//@routes  PUT /api/v1/bootcamps/:id
//@access  private
exports.updateBootcamp = asyncHandler(async (req,res,next)=>{

    
        let bootcamp =await Bootcamp.findById(req.params.id,req.body,{
            new: true,
            runValidators: true
        });
        
        if(!bootcamp){
            return  next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`,404));
            
        }

        //make sure user is bootcamp owner
        if(bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin'){
            return  next(new ErrorResponse(`User ${req.params.id} is not authorized to update this bootcamp`,401));
        }

        bootcamp = await Bootcamp.findOneAndUpdate(req.params.id,req.body,{
            new: true,
            runValidators: true
        })
    
        res.status(200).json({success: true,data: bootcamp});
    
});


//@desc    delete bootcamps
//@routes  DELETE /api/v1/bootcamps/:id
//@access  private
exports.deleteBootcamp =asyncHandler(async (req,res,next)=>{
    
    
        const bootcamp =await Bootcamp.findById(req.params.id);
        
        if(!bootcamp){
            return  next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`,404));
        }


         //make sure user is bootcamp owner
         if(bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin'){
            return  next(new ErrorResponse(`User ${req.params.id} is not authorized to update this bootcamp`,401));
        }

        bootcamp.remove();
        res.status(200).json({success: true,data: {} });

   
    
});

//@desc    GET bootcamps within a radius
//@routes  GET /api/v1/bootcamps/radius/:zipcode/:distance
//@access  private
exports.getBootcampsInRadius =asyncHandler(async (req,res,next)=>{  
    const {zipcode,distance} = req.params;

    //Get lat/lng from geocoder
    const loc =await geocoder.geocode(zipcode);
    const lat = loc[0].latitude;
    const lng = loc[0].longitude;

    //cal radius using radians
    //divide dist by radius of earth
    //earth radius = 3,963 mi/ 6378km
    const radius = distance/3963;

    const bootcamps =await Bootcamp.find({
        location: {$geoWithin: { $centerSphere: [ [ lng, lat ], radius ] }}
    })

    res.status(200).json({
       success: true,
       count: bootcamps.length,
       data: bootcamps 
    });

});




//@desc    Upload photo for bootcamp
//@routes  PUT /api/v1/bootcamps/:id/photo
//@access  private
exports.bootcampPhotoUpload = asyncHandler(async (req,res,next)=>{    
    const bootcamp = await Bootcamp.findById(req.params.id);

    if(!bootcamp){
        return  next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`,404));
    }  
    
    if(!req.files){
        return  next(new ErrorResponse(`Please upload a file`,400));
    }

    const file = req.files.file;

    //Make sure the image is a  photo
    if(!file.mimetype.startsWith('image')){
        return  next(new ErrorResponse(`Please upload an image file`,400));
    }
    

    //Check filesize
    if(file.size > process.env.MAX_FILE_UPLOAD)
    {
        return next(new ErrorResponse(`Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`,400));
    }

    //create custom filename
    file.name=`photo_${bootcamp._id}${path.parse(file.name).ext}`;

    file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`,async err=>{
        if(err){
            console.error(err);
            return next(
                new ErrorResponse(
                    `Problem with file upload`,500
                )
            )
        }

        await Bootcamp.findByIdAndUpdate(req.params.id,{ photo:file.name });

        res.status(200).json({
            success: true,
            data: file.name
        });
    });

    

});
