const express = require('express');
const app = express();
const cors = require('cors');
const controller = require('./controller');
const bodyParser = require('body-parser');
require('dotenv').config(); 
app.use(cors());
app.use(bodyParser.json());



app.use(
    express.urlencoded({
        extended: true,
    })
);

app.use(express.json());


app.get('/register',(req,res)=> {
    controller.registerUser((req,res,next)=>{
        res.send();
    });
});






module.exports = app;