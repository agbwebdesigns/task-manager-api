const express= require('express');
const Tasks= require('../models/task');
const auth= require('../middleware/authenticate')
const router= new express.Router();

router.post('/tasks',auth,async(req,res) =>  {  //setting up request and response handlers
    //const task= new Tasks(req.body);  //creates a new task with incoming json data
    const task= new Tasks({
        ...req.body,  //es6 spread operator, takes elements of the body array and makes them parameters for the function
        owner:req.user._id
    });

    try  {
        const tasks= await task.save();
        res.status(201).send(tasks);  //setting the success status and sending the task data
    }catch(e)  {
        res.status(400).send(e);  //setting the http status code to 400 in the event of a client error, must be before send
    }
})

router.get('/tasks',auth,async(req,res) =>  {  //setting up request and response handlers to get multiple users data
    const match= {};
    const sort= {};

    if (req.query.completed)  {
        match.completed=req.query.completed==='true';
    }

    if (req.query.sortBy)  {
        const parts= req.query.sortBy.split(':');
        sort[parts[0]]= parts[1]==='desc'?-1:1;  //after the ? are the values, -1 for true, 1 for false
    }

    try  {
        await req.user.populate({
            path:'tasks',
                match,
                options: {
                    limit:parseInt(req.query.limit),  //this is whatever limit is specified in the url string if any
                    skip:parseInt(req.query.skip),
                    sort
                }
        }).execPopulate();
        res.send(req.user.tasks);
    }catch(e)  {
        res.status(500).send();
    }
})

router.get('/tasks/:id',auth,async(req,res) =>  {  //setting up request and response handlers to get one task data

    try  {
        const task= await Tasks.findOne({_id,owner:req.user._id})
        if (!task)  {  //if no task is found from the search
            return res.status(404).send();  //change the status to 404
        }
        res.send(task);  //if a task is found then send the user data
    }catch(e)  {
        console.log('Not a task!');
        res.status(500).send();
    }
})

router.patch('/tasks/:id',auth,async(req,res) =>  {  //patch is for changing the information
    const _id= req.params.id;
    console.log(_id);
    const updates= Object.keys(req.body);  //returns the keys of the Object being searched
    const allowedUpdates= ['completed','description'];
    const isValidOperation= updates.every((update) =>  allowedUpdates.includes(update));

    if (!isValidOperation)  {
        return res.status(400).send({error:'Invalid Updates!'});
    }

    try  {
        const task= await Tasks.findOne({_id:req.params.id, owner:req.user._id});  //finds by id but, takes into account the owner as well
        
        if (!task)  {  //if there is no task found
            return res.status(404).send();
        }
        updates.forEach((update) =>  {  //updates is an array of strings, so each string is the parameter being passed through
            task[update]= req.body[update];  //this sets the value being updated in user equal to the new value that is passed in, updating this way is necessary so that middleware can be used
        })
        await task.save();
        res.send(task);  //if the user is found
    }catch(e)  {
        res.status(400).send();  //if invalid information is passed
    }
});

router.delete('/tasks/:id',auth,async(req,res) =>  {  //endpoint to delete a task
    const _id= req.params.id;
    try  {
        const task= await Tasks.findOneAndDelete({_id:req.params.id, owner:req.user._id})
        if (!task)  {
            return res.status(404).send();
        }
        res.send(task);
    }catch(e)  {
        res.status(500).send();
    }
})

module.exports= router;