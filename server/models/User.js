const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { isEmail } = require('validator');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, "Username required!"],
        validate: [(value) => {
                var regex = /^[\w\s]+$/;   
                if (regex.test(value)) {
                  return true;
                } else {
                  return false;
                }    
        }, 'Username cant contains special characters'],
        minlength: [3, "Username must be at least 3 characters"],
        maxLength: [30, "Username cant be more than 30 characters"],
    },
    email: {
        type: String,
        unique: [true, "This email already registered!"],
        validate: [isEmail, "Please enter a valid email!"],
        required: [true, 'Email required']
    },
    password: {
        type: String,
        minlength: [6, "Password must be at least 6 characters"],
        required: [true, 'Password required'],
        maxLength: [30, "Password cant be more than 30 characters"],
    },
    posts: [
      {
        postName: {
          type: String,
          required: [true, "postName required"],
        },
        postTitle: {
          type: String,
          required: [true, 'postTitle required']
        },
      }
    ]
});

userSchema.pre('save', async function (next) {
  const salt = await bcrypt.genSalt();
  this.password = await bcrypt.hash(this.password, salt);
  next();
})

userSchema.statics.login = async function (email, password) {
  const user = await this.findOne({email});
  if (user) {
    const match = await bcrypt.compare(password, user.password);
    if (match) {
      return user;
    }
    throw Error("Invalid password");
  }
  throw Error("User not found");
};

const User = mongoose.model('thedata', userSchema);

module.exports = User;