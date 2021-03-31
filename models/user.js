var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
var userSchema = new Schema({
    name:{
        type:String,
        required:true,       
        trim:true
    },
    email:{
        type:String,
        required:true,
        minlength:2,
        unique:true,
        lowercase:true,
        validate:[validator.isEmail,'please provide a valid email']
    },
    password:{
        type:String,
        required:true,
        minlength:8,
        select:false
    },
    passwordConfirmation:{
        type:String,       
        validate: {
            // only works on create and save
            validator: function(value){
                return value === this.password;
            },
            message:'Password Mismatch'   
        }
    },
    passwordChangedAt:Date,
    passwordResetToken:String,
    passwordResetExpires:Date
},{timestamps:true});

userSchema.pre('save', async function(next){
    console.log('pre save was called');
    // runs if password was modified
    if(!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password,12);
    this.passwordConfirmation = undefined;

});
userSchema.pre('save', function(next){
    if(!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000;
    next();

});

userSchema.methods.correctPassword = async function(candidatePassword, userPassword){
    return await bcrypt.compare(candidatePassword,userPassword)

}
userSchema.methods.changedPassedAfter = function(JWTTimestamp){
    if(this.passwordChangedAt){
        const changedTimeStamp = parseInt(this.passwordChangedAt.getTime()/1000,10);
        console.log(changedTimeStamp, JWTTimestamp);

        return JWTTimestamp < changedTimeStamp;
    }
    return false;

}
userSchema.methods.createPasswordResetToken = function(){
    const resetToken = crypto.randomBytes(30).toString('hex');
   this.passwordResetToken =  crypto.createHash('sha256').update(resetToken).digest('hex');

   this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

   console.log({resetToken}, this.passwordResetToken);

   return resetToken;

}
 
module.exports = mongoose.model('User',userSchema);