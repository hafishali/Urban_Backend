const mongoose = require('mongoose')

const connectionString = process.env.DATABASE

mongoose.connect(connectionString).then(()=>{
    console.log('mongoDB Atlas successfully connected with serviceserver');
}).catch((err)=>{
    console.log(`mongoDB Atlas failed to connect with serviceserver! error: ${err}`);
})