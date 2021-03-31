require('dotenv').config();
const nodemailer = require('nodemailer');

const sendEmail = async options  => {
    console.log(options);
    // 1) Create  a Transporter
    const transporter = nodemailer.createTransport({
            host:process.env.EMAIL_HOST,
            port:process.env.EMAIL_PORT,
            auth:{
                user:process.env.EMAIL_USERNAME,
                pass:process.env.EMAIL_PASSWORD
            }
        });
        // 2) Define the email options,
        const mailOptions = {
            from:'CheckyProperty <checkyproperty@io.com>',
            to: options.email,
            subject:options.subject,
            text:options.message

        };

       try{
        await  transporter.sendMail(mailOptions);

       }catch(error){
           console.log(error);

       }
}
module.exports = sendEmail;


