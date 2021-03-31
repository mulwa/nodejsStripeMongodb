
const http = require('http');
const mongoConnect = require('./db/mongoConnection');
require('dotenv').config();
require('./db/mongoConnection');

const app = require('./app');
const port = process.env.PORT || 3300;

const server = http.createServer(app);

server.listen(port,()=>{
    console.log(`Server running on Port: ${port}`);
})


