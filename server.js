const express = require('express');
const app = express();
const cors = require('cors');



const port = 3001;
const host = 'localhost';
const mongoose = require('mongoose');
const router = require('./router');
require('dotenv').config();

app.use(cors());
app.use(express.json());

  
const uri ='mongodb+srv://mcquizproject:MCQUIZ1234@cluster0.mwf2w.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'

const connect = async () => {
    try {
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
};

connect();

const server = app.listen(port, host, () => {
    console.log(`Node server is listening to ${server.address().port}`);
});

app.use('/api',router);