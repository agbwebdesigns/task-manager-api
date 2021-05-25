const jwt= require('jsonwebtoken');
const User= require('../models/user');

const auth= async (req,res,next) =>  {
    try  {
        const token= req.header('Authorization').replace('Bearer ', '');  //this is the token that was saved in the header
        const decoded= jwt.verify(token,process.env.JWT_SECRET);  //this is the decoded token with the id key
        const user= await User.findOne({_id:decoded._id,'tokens.token':token});  //this is looking for a specific user that has the authentication token stored that we are comparing
        if (!user)  {
            throw new Error();
        }
        req.token= token;
        req.user= user;
        next();
    }catch(e)  {
        res.status(401).send({error:'Please Autheniticate!'});
    }
}

module.exports= auth;