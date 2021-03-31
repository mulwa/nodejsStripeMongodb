const mongoose = require('mongoose');
require('dotenv').config();

const connectionOptions = { useCreateIndex: true, useUnifiedTopology: true,useNewUrlParser: true, useFindAndModify: true };
mongoose.connect(process.env.DATABASE, connectionOptions).then(()=> console.log("DB connection")).catch(error => console.log("DB connection error"+error));
mongoose.Promise = global.Promise;

// module.exports = {
//     // User: require('../users/user.model')
// }

