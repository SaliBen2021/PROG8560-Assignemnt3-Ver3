/* Web Application For a whole website
  Project
   
   
   Revision history
       Sali Ben Suleiman, 2021.08.14: Created 

*/
/****************************Dependencies****************************/
// import dependencies you will use
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { check, validationResult, header } = require('express-validator');
const { json } = require('body-parser');
//get express session
const session = require('express-session');

/****************************Database****************************/
//MongoDB
// Takes two arguments path - Includes type of DB, ip with port and name of database
// If Library was not created this would create it through code!!!
mongoose.connect('mongodb://localhost:27017/Library',
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

/****************************Models****************************/
const User = mongoose.model('users', {
    username: String,
    password: String
});

const Contact = mongoose.model('contacts', {
    name: String,
    email: String
});

// set up the model for the order
const Post = mongoose.model('posts', {
    titleDB: String,
    imageDB: String,
    contentDB: String
});

/****************************Variables****************************/
var myApp = express();

myApp.use(express.urlencoded({ extended: false }));

myApp.use(session({
    secret: 'superrandomsecret',
    resave: false,
    saveUninitialized: true
}));
myApp.use(express.static("public"));//image should be in th public folder

myApp.use(function (req, res, next) {
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    next();
});

//parse application json
myApp.use(express.json());
// set path to public folders and view folders
myApp.set('views', path.join(__dirname, 'views'));
//use public folder for CSS etc.
myApp.use(express.static(__dirname + '/public'));
myApp.set('view engine', 'ejs');



/****************************Page Routes****************************/

//home page

myApp.get('/', function (req, res) {
    res.render('home',); 
});

//login page
myApp.get('/login', function (req, res) {
    res.render('login', { userLoggedIn: req.session.userLoggedIn }); 
});

myApp.post('/login', function (req, res) {
    var agent = req.body.username;
    var pw = req.body.password;  

    User.findOne({ username: agent, password: pw }).exec(function (err, users) {
            if (users) {
            //store username in session and set logged in true
            req.session.username = users.username;
            req.session.userLoggedIn = true;
            // redirect to the admin page
            res.redirect('/adminPage');
        }
        else {
            res.render('login', { error: 'Sorry, cannot login!' });
        }

    });

});
//admin page
myApp.get('/adminPage', function (req, res) {
    res.render('adminPage', { userLoggedIn: req.session.userLoggedIn }); // no need to add .ejs to the file name
});

// about page
myApp.get('/about', function (req, res) {
    res.render('about', { userLoggedIn: req.session.userLoggedIn }); // no need to add .ejs to the file name
});

//Contact Page
myApp.get('/contact', function (req, res) {
    res.render('contactform', { userLoggedIn: req.session.userLoggedIn });
});

myApp.post('/contact', [
    check('name', 'Must have a name').not().isEmpty(),
    check('email', 'Must have an email').isEmail(),
],
    function (req, res) {
        const errors = validationResult(req);
        console.log(req.body);
        if (!errors.isEmpty()) {
            res.render('contactform', {
                errors: errors.array()
            });
        }
        else {
            var name = req.body.name;
            var email = req.body.email;
            var myNewContact = new Contact(
                {
                    name: name,
                    email: email
                }
            )
            myNewContact.save().then(() => console.log('New contact saved'));

            res.render('contactthanks', {
                name: name,
                email: email
            });
        }
    }
)

// Add page
myApp.get('/addpage', function (req, res) {
    res.render('addpage', { userLoggedIn: req.session.userLoggedIn });
});

myApp.post('/addpage', function (req, res) {

    var title = req.body.title;
    var image = req.body.image;
    var content = req.body.content;
    var myNewPost = new Post({
        titleDB: title,
        imageDB: image,
        contentDB: content
    })
    myNewPost.save().then(() => console.log('New page saved'));

    res.redirect('addpagesuccess');
});

//success page
myApp.get('/addpagesuccess', function (req, res) {
    res.render('addpagesuccess', { userLoggedIn: req.session.userLoggedIn });
});

// all pages
myApp.get('/allBooks', function (req, res) {
    // check if the user is logged in
    console.log(req.session.username);

    Post.find({}).exec(function (err, posts) {
        res.render('allBooks', { posts: posts, userLoggedIn: req.session.userLoggedIn });
    });

});

//Edit page
//Use uniques mongodb id
myApp.get('/edit/:orderid', function (req, res) {
    var orderid = req.params.orderid;
    console.log(orderid);
    Post.findOne({ _id: orderid }).exec(function (err, post) {
        console.log('Error: ' + err);
        console.log('Page: ' + post);
        if (post) {
            res.render('edit', { post: post, userLoggedIn: req.session.userLoggedIn });//Render edit with the order
        }
        else {
            //This will be displayed if the user is trying to change the order id in the url
            res.send('No order found with that id...');
        }
    });
});


myApp.post('/edit/:id', function (req, res) {

    var orderid = req.params.id;
    var title = req.body.title;
    var image = req.body.image;
    var content = req.body.content;
    Post.findOne({ _id: orderid }).exec(function (err, post) {
        console.log('Error: ' + err);
        console.log('Page: ' + post);
        post.titleDB = title;
        post.imageDB = image;
        post.contentDB = content;
        post.save();
    });


    res.redirect('/editDone');
});

//editDone page
myApp.get('/editDone', function (req, res) {
    res.render('editDone', { userLoggedIn: req.session.userLoggedIn });
});

//Delete page
myApp.get('/delete/:orderid', function (req, res) {
    var orderid = req.params.orderid;
    console.log(orderid);
    Post.findByIdAndDelete({ _id: orderid }).exec(function (err, post) {
        if (post) {
            res.render('delete', { message: 'Successfully deleted ', userLoggedIn: req.session.userLoggedIn });
        }
        else {
            res.render('delete', { message: 'Sorry, could not delete!', userLoggedIn: req.session.userLoggedIn });
        }
    });

});

//Logout Page
myApp.get('/logout', function (req, res) {
    //Remove variables from session
    req.session.username = '';
    req.session.userLoggedIn = false;
    req.session.destroy;

    res.redirect('/')
    //res.render('login', {error: "Logged Out"});
});

// start the server and listen at a port
//myApp.listen(8080);
process.env.PORT;

//tell everything was ok
console.log('Everything executed fine.. website at port 8080....');


