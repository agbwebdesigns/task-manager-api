const express= require('express');
require('./db/mongoose');  //only needed to make sure that mongoose starts
const userRouter= require('./routers/users');
const taskRouter= require('./routers/tasks');

const app= express();
const port= process.env.PORT;  //looking at process.env.PORT to get the port value, otherwise defaulting to port 3000

app.use(express.json());  //automatically parses incoming json data to an Object so it can be used
app.use(userRouter);
app.use(taskRouter);

app.listen(port,() =>  {  //this starts the server
    console.log('Server is up on port '+port);
})