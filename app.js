const express = require('express');
var app = express();
var userRoute = require('./routes/user_routes');
const morgan = require('morgan');
const AppError = require('./utils/appError');
const globalErrorHandlers = require('./controllers/error_controller');

app.use(morgan('dev'));


app.use(express.urlencoded({extended:true}));
app.use(express.json());


app.use('/api/v1/user',userRoute);

app.all('*',(req,res,next)=>{
    next(new AppError(`Can't find ${req.originalUrl}`,400))
});

app.use(globalErrorHandlers);



module.exports = app;