const mongoose= require('mongoose');
const validator= require('validator');
const bcrypt= require('bcryptjs');
const jwt= require('jsonwebtoken');
const Task= require('./task');

const userSchema= new mongoose.Schema({  //mongoose creates a schema on it's own but, creating one manually allows for middleware
    name: {
        type:String,
        required:true,
        trim:true
    },
    email: {
        type:String,
        unique:true,
        required:true,
        trim:true,
        lowercase:true,
        validate(value)  {
            if (!validator.isEmail(value))  {
                throw new Error('Email address is invalid');
            }
        }
    },
    age: {
        type:Number,
        default:0,
        validate(value)  {
            if (value<0)  {
                throw new Error('Age must be a positive number!');
            }
        }
    },
    password:  {
        type:String,
        required:true,
        trim:true,
        minLength:7,
        validate(value)  {
            if (value==='password')  {
                throw new Error('Your password cannot be password');
            }
        }
    },
    tokens:  [{
        token:  {
            type:String,
            required:true
        }
    }],
    avatar:  {
        type:Buffer  //stores buffer with binary image data in the database alongside the user that the image belongs to
    }
},{
    timestamps:true
});

userSchema.virtual('tasks',{
    ref:'Tasks',
    localField:'_id',
    foreignField:'owner'
})  //creates virtual data to create a relationship between user and task

userSchema.methods.toJSON= function()  {
    const userObject= this.toObject();
    delete userObject.password;
    delete userObject.tokens;
    delete userObject.avatar;
    return userObject;
}

userSchema.methods.generateAuthToken= async function ()  {  //cannot use (this) with shorthand functions, these are methods on the individual user
    const token= jwt.sign({_id:this._id.toString()},process.env.JWT_SECRET);  //this creates a token by sending a payload that id's the user and a string to help create the random token
    this.tokens=this.tokens.concat({token});
    await this.save();
    return token;
}

userSchema.statics.findByCredentials= async(email,password) =>  {  //this creates a schema to find the user by the email address and make sure the password is correct, findByCredentials becomes a reusable userSchema static, this is for methods on the User.model
    const user= await User.findOne({email})  //this looks for the account with the given email address provided
    if (!user)  {
        throw new Error('Unable to log in!')
    }

    const isMatch= await bcrypt.compare(password,user.password)  //this compares the password given with the encrypted hash of the password connected to the username given
    if (!isMatch)  {
        throw new Error('Unable to log in!')
    }
    return user;
}

//hash the plain text password before saving!
userSchema.pre('save',async function(next)  {
    console.log('just before saving!');

    if (this.isModified('password'))  {  //if password is what is being modified
        console.log('password is being modified or created!');
        this.password= await bcrypt.hash(this.password,8);  //run bcrypt to hash the password
        console.log('new password encrypted!');
    }
    next();  //next is the parameter that is passed in, it is a funtion that has to be run for the program to continue or it will just hang here
})

userSchema.pre('remove',async function(next)  {  //delete user tasks when user is deleted
    await Task.deleteMany({owner:this._id});  //delete all tasks where the owner equals the user._id
    next();
})

const User= mongoose.model('User',userSchema);

module.exports= User;