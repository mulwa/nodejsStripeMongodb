const {promisify} = require('util');
var User = require('../models/user');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catch_async');
const sendEmail = require('../utils/email');
const crypto = require('crypto');

const signToken = id => {
    return jwt.sign({id},process.env.JWT_SECRET,{expiresIn:process.env.JWT_EXPIRES_IN});

}

const createSendToken = (user,statusCode,res)=>{
    const token = signToken(user._id);
         return res.status(statusCode).json({
            status:true,
            message:'user registered successfully',
            token,
            user:user
        });

}


exports.registerUser = async (req,res,next)=>{
    if(!req.body.email){
        return res.status(400).json({
            status:false,
            message:"Email address is required"
        });
    }
    if(!req.body.name){
        return res.status(400).json({
            status:false,
            message:"Name is required"
        });
    }
    if(!req.body.password){
        return  res.status(400).json({
            status:false,
            message:"password is required"
        });
    }
   
    let {email,name,password,passwordChangedAt} = req.body;

    

    User.findOne({email}).exec(async(error,user) => {
        if(error){
            return res.status(400).json({
                status:false,
                message:`Error ${error}`
            });

        }
        if(user){
            return res.status(400).json({
                status:false,
                message:"user with this email already exists"
            });
        }
         let newUser = await User.create({name,email,password,passwordChangedAt});
         createSendToken(newUser,201,res);
         
        
    });   
   
};
exports.getAllUser = async(req,res,next)=> {
    let users = await User.find();
    if(users){
        return res.status(200).json({
            status: true,
            users
        });

    }else {
        return res.status(400).json({
            status: false,
            message:"No user Found"
        });
    }    
};

exports.login = async(req,res,next)=>{
    const {email,password} = req.body;

    if(!email || !password){
       return  next(new AppError('Please provide email and password',400));
    }
    const user = await User.findOne({email}).select('+password');
    if( !user || !(await user.correctPassword(password,user.password))){
        return next(new AppError('Incorrect email of password',401));

    }    
    console.log(user);
    createSendToken(user,200,res);

       
}

exports.protectRoute = async(req,  res, next)=>{
    var currentUser;

    // Getting 
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(' ')[1];

    }
    if(!token){
        return next(new AppError('You are not logged in ! please log in',401));
    }
    // token verification
   try{
    const decoded = await promisify(jwt.verify)(token,process.env.JWT_SECRET);
    console.log(decoded.id);
    // check if user still exists
     currentUser = await User.findById(decoded.id);
    if(!currentUser){
        return next(new AppError('The user belonging to this token does no longer exist',401));        
    }

    // check if user changed password after the token was issued
    if(currentUser.changedPassedAfter(decoded.iat)){
        return next(new AppError(`User changed password please log in again`,401));

    }
   }catch(error){
       if(error.name == 'JsonWebTokenError'){
        return next(new AppError('Invalid token',401));
       } else {
        return next(new AppError(`Authentication error ${error}`,401));
       }      

   }

   req.user = currentUser;
    next();
}

exports.resetPassword = async(req,res,next)=>{   
    
    const resetToken = req.params.token;
    console.log(resetToken);
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const user = await User.findOne({passwordResetToken:hashedToken,passwordResetExpires:{$gt:Date.now()},});

    if(!user){
        return next(new AppError('Token is invalid or has expired',400));
    }
    user.password = req.body.password;
    user.passwordConfirmation = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    try{
        await user.save();
        createSendToken(user,200,res);
        
        

    }catch(error){
        return res.status(400).json({
            status:false,
            message:`Error ${error}`,
            
        })

    }

    

    

    

}
exports.forgotPassword = async(req,res,next)=>{
    const email = req.body.email;
    const user = await User.findOne({email});
    if(!user){
        return next(new AppError(`No user with ${email}`));
    }
    const resetToken = user.createPasswordResetToken();
    console.log(resetToken);
    try{
        await user.save({validateBeforeSave:false});

    }catch(error){
        console.log('error'+error);

    }
    
    // send to user
    const resetURl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    console.log(resetURl);

    const message =   `Forgot your password? reset your password with new password with ${resetURl}. \n If you didn't forget your password please ignore this email!`;

    try{
        await sendEmail({
            email:user.email,
            subject:'Your password reset token (valid for 10 minutes only)',
            message
        });
    
        res.status(200).json({
            status:true,
            message:'Token sent to email'
        });
    
    }catch(error){
        console.log(error);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({validateBeforeSave:false});
        return next(new AppError(`Error sending the email. Try again later`,500));
        
    }
}

exports.updatePassword = async(req, res,next)=> {
    try{
    const user = await User.findById(req.user.id).select('+password');
    if(!(await user.correctPassword(req.body.currentPassword,user.password))){
        return next(new AppError('Your current password is wrong'));
    }
    // update password
    user.password = req.body.password;
    user.passwordConfirmation = req.body.passwordConfirm;
    await user.save();
    createSendToken(user,200,res);


    }catch(error){
        return res.status(400).json({
            status:false,
            message:`Error ${error}`,
            
        });

    }

}

