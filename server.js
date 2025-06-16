const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const apiRoutes = require('./routes/api');

app.use(express.json());
app.use('/api', apiRoutes);
app.use(express.static('public'));


app.listen(3000, '0.0.0.0', () => {
    console.log(`Server 3000 port çalışıyor`);
     
});
