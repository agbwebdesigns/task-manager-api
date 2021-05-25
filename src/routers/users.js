const express= require('express');
const User= require('../models/user');
const auth= require('../middleware/authenticate');
const multer= require('multer');
const sharp= require('sharp');
const {sendWelcomeEmail,sendCancelEmail}= require('../emails/account')
const router= new express.Router();
const upload= multer({
    limits: {
        fileSize:1000000
    },
    fileFilter(req,file,cb)  {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/))  {  //this checks that the file extention is .doc or .docx
            return cb(new Error('Please upload a .jpg, .jpeg or .png image file!'))
        }

        cb(undefined,true);
    }
})

router.post('/users',async(req,res) =>  {  //setting up request and response handlers to post new data, this creates a new user
    const user= new User(req.body);  //creates a new user with incoming json data

    try  {
        await user.save()  //if the promise of user.save() is fulfilled then the next line will run, otherwise catch will run
        sendWelcomeEmail(user.email,user.name);
        const token= await user.generateAuthToken();  //this runs a function to generate an authentication token and save it
        res.status(201).send({user,token});  //setting the success status and sending the user data
    } catch(e)  {
        res.status(400).send(e);  //setting the http status code to 400 in the event of a client error, must be before send
    }
})

router.post('/users/login',async(req,res) =>  {  //this allows an existing user to log in
    try {
        const user= await User.findByCredentials(req.body.email,req.body.password);  //this finds the user by the user name and checks the attempted password against the stored hash 
        const token= await user.generateAuthToken();  //this runs a function to generate an authentication token and save it
        res.send({user,token});
    }catch(e)  {
        res.status(400).send(e);
    }
})

router.post('/users/logout',auth, async(req,res) =>  {
    try  {
        req.user.tokens= req.user.tokens.filter((token) =>  {  //set the tokens array to a filtered version of itself so the user can't continue doing tasks since the tokens won't match anymore
            return token.token !== req.token;  //return when they don't match
        })
        await req.user.save();  //waits to make sure the new token saves to the user
        res.send();
    }catch(e)  {
        res.status(500).send();
    }
})

router.post('/users/logoutAll',auth,async(req,res) =>  {
    try  {
        req.user.tokens= [];  //simply empties the tokens array
        await req.user.save();
        res.status(200).send();
    }catch(e)  {
        res.status(500).send();
    }
})

router.get('/users/me', auth, async(req,res) =>  {  //setting up request and response handlers to get multiple users data
    res.send(req.user);
})

router.patch('/users/me',auth,async(req,res) =>  {  //patch is for changing some user information
    const updates= Object.keys(req.body);  //returns the keys of the Object being searched, in this case the request body
    const allowedUpdates= ['name','email','password','age'];
    const isValidOperation= updates.every((update) =>  allowedUpdates.includes(update));

    if (!isValidOperation)  {
        return res.status(400).send({error:'Invalid Updates!'});
    }

    try  {
        updates.forEach((update) =>  {  //updates is an array of strings, so each string is the parameter being passed through
            req.user[update]= req.body[update];  //this sets the value being updated in user equal to the new value that is passed in, updating this way is necessary so that middleware can be used
        })
        await req.user.save();        
        res.send(req.user);  //if the user is found
    }catch(e)  {
        res.status(400).send();  //if invalid information is passed
    }
});

router.delete('/users/me',auth,async(req,res) =>  {  //this deletes the user that is logged in
    try{    
        await req.user.remove();
        res.send(req.user);
    }catch(e)  {
        res.status(500).send();
    }
})

router.post('/users/me/avatar',auth,upload.single('avatar'),async(req,res) =>  {
    const buffer=await sharp(req.file.buffer).resize({width:250,height:250}).png().toBuffer();  //this send the image into sharp, crops it and changes it to a .png file, then send it back to the buffer

    req.user.avatar=buffer;  //this can only be accessed when a destination directory is not setup
    await req.user.save();
    res.send();
},(error,req,res,next) =>  {  //this routes my errors to the user when they happen rather then the html error that was
    res.status(400).send({error:error.message});
})

router.delete('/users/me/avatar',auth,async(req,res) =>  {
    req.user.avatar=undefined;
    await req.user.save();
    sendCancelEmail(req.user.email,req.user.name);
    res.send();
},(error,req,res,next) =>  {  //this routes my errors to the user when they happen rather then the html error that was
    res.status(400).send({error:error.message});
})

router.get('/users/:id/avatar',async(req,res) =>  {
    try {
        const user= await User.findById(req.params.id);
        if (!user||!user.avatar)  {
            throw new Error();
        }
        res.set('Content-Type','image/png');  //this is a response header that tells the requester what type of data they are getting back
        res.send(user.avatar);
    }catch(e) {
        res.status(404).send();
    }
})

module.exports= router;