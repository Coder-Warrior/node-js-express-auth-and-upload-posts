const express = require('express');
const mongoose = require('mongoose');
const User = require('./models/User');
const e = require('express');
const jwt = require('jsonwebtoken');
const {check} = require("./middlewares/auth");
const cookieParser = require('cookie-parser');


const port = process.env.PORT || 3000;

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static('./public/'));
app.use(cookieParser());

app.set('view engine', 'ejs');

// Authenticaion

function handleErrors (err) {
    let errors = {name: '', email: '', password: ''};

    if (err.message === "User not found") {
         errors.email = "User not found";
    } 

    if (err.message === "Invalid password") {
         errors.password = "Invalid password";
    }

    if (err.code == 11000) {
        errors.email = 'This email already registered!';
    }
    if (err.errors) {
        for (let i = 0; i < Object.values(err.errors).length; i++) {
            errors[Object.values(err.errors)[i].properties.path] = Object.values(err.errors)[i].properties.message;
        }
    }
    return errors;
}
const maxAge = 3 * 24 * 60 * 60;
function createToken(id) {
    return jwt.sign({ id }, "951555951555", {expiresIn: maxAge})
}

app.get('/', check, async (req, res) => {

    token = req.cookies.jwt;

    const id = jwt.verify(token, "951555951555",  (err, d) => {
        if (d) {
            return d;
        } else if (err) {
            res.redirect("/login");
        }
    });

    let allUsers = await User.find({});
    let currentUser = {};

    for (let i = 0; i < allUsers.length; i++) {
        if (`${allUsers[i]._id}` == id.id) {
            currentUser = allUsers[i];
            break;
        }
    }

    res.render('index', { currentUser: [currentUser, []] });
});

app.get('/signup', (req, res) => {
    res.render('signup');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/signup', async (req, res) => {
    try {
        const user = await User.create(req.body);
        const token = createToken(user._id);
        res.cookie('jwt', token, { maxAge: maxAge * 1000 });
        res.status(200).json(req.body);
    } catch (e) {
        let errors = handleErrors(e);
        res.status(400).json({errors});
    }
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.login(email, password);
        const token = createToken(user._id);
        res.cookie('jwt', token, { maxAge: maxAge * 1000 });
        res.status(200).json({user: user._id});
    } catch (e) {
        const errors = handleErrors(e);
        res.status(401).json({errors})
    }
});

app.get('/signout', (req, res) => {
    res.cookie('jwt', '', {maxAge: 1});
    res.redirect('/login');
});

// addPost

app.get('/addpost', async (req, res) => {
    res.render('addpost');
});

app.post('/addpost', async (req, res) => {
    try {
        const token = req.cookies.jwt;

        const id = jwt.verify(token, "951555951555",  (err, d) => {
            if (d) {
                return d;
            } else if (err) {
                res.redirect("/login");
            }
        });
        const test = await User.updateOne({_id: id.id}, {$push: {posts: req.body}});
        res.status(200).redirect("/");
    } catch (e) {
        res.status(400).json({e});
    }
});

app.get('/editpost/:postId', async (req, res) => {

    token = req.cookies.jwt;

    const useid = jwt.verify(token, "951555951555",  (err, d) => {
        if (d) {
            return d;
        } else if (err) {
            res.redirect("/login");
        }
    });

    let allUsers = await User.find({});
    let currentUser = {};

    for (let i = 0; i < allUsers.length; i++) {
        if (`${allUsers[i]._id}` == useid.id) {
            currentUser = allUsers[i];
            break;
        }
    }

    const {postId} = req.params;

    let post = {};
    currentUser.posts.forEach(element => {
        if (element._id == postId) {
        post = element;
        console.log(element);
        }
    });

    res.render('editpost', { post });
});

app.post('/editpost/:postId', async (req, res) => {
    token = req.cookies.jwt;

    const useid = jwt.verify(token, "951555951555",  (err, d) => {
        if (d) {
            return d;
        } else if (err) {
            res.redirect("/login");
        }
    });

    let allUsers = await User.find({});
    let currentUser = {};

    for (let i = 0; i < allUsers.length; i++) {
        if (`${allUsers[i]._id}` == useid.id) {
            currentUser = allUsers[i];
            break;
        }
    }

    const {postId} = req.params;

    let post = {};
    currentUser.posts.forEach(element => {
        if (element._id == postId) {
        post = element;
        console.log(element);
        }
    });

    await User.updateOne({_id: useid.id, 'posts._id': `${postId}`}, {$set: {'posts.$.postName': req.body.postName, 'posts.$.postTitle': req.body.postTitle}}).then(() => {console.log('updated')}).catch(() => {console.log('cant update')});
    res.redirect('/');
});

app.get('/deletepost/:postId', async (req, res) => {
    token = req.cookies.jwt;

    const useid = jwt.verify(token, "951555951555",  (err, d) => {
        if (d) {
            return d;
        } else if (err) {
            res.redirect("/login");
        }
    });

    let allUsers = await User.find({});
    let currentUser = {};

    for (let i = 0; i < allUsers.length; i++) {
        if (`${allUsers[i]._id}` == useid.id) {
            currentUser = allUsers[i];
            break;
        }
    }

    const {postId} = req.params;

    let post = {};
    currentUser.posts.forEach(element => {
        if (element._id == postId) {
        post = element;
        }
    });

    await User.updateOne({_id: useid.id, 'posts._id': `${postId}`}, {$pull: {posts: {_id: postId}}}).then(() => {console.log('updated')}).catch(() => {console.log('cant update')});
    res.redirect('/');
});

app.post('/search', async (req, res) => {
    const token = req.cookies.jwt;
    let userId = jwt.verify(token, "951555951555",  (err, d) => {
        if (d) {
            return d;
        } else if (err) {
            res.redirect("/login");
        }
    });
    let user = await User.find({_id: userId.id});
    let posts = [];
    user[0].posts.forEach(element => {
        if (element.postName == req.body.username) {
        posts.push(element);
        }
    });
    res.render('index', {currentUser: [user[0], posts]});
});

async function con () {
    try {
        await mongoose.connect('mongodb+srv://ali:Jj7nwuCkF9fUojR9@cluster0.jvmmmzc.mongodb.net/thedata?retryWrites=true&w=majority&appName=Cluster0');
        app.listen(port, () => {
            console.log(`DB Connected And Server Running On Port => ${port}`)
        });
    } catch (e) {
        console.log(e);
    }
};

con();