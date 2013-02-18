
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , Facebook = require('facebook-node-sdk')
  , mongoose = require('mongoose')
  , usermodel = require('./models/usermodel')
  , User = usermodel.User;

var app = express();

app.configure(function(){
  mongoose.connect(process.env.MONGOLAB_URI || 'mongodb://localhost/facebook');
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(Facebook.middleware({ appId: '484581731587730', secret: 'b6dc8e346a1a2423c9f569be4a688fd3' }));
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});
//req.user is actually facebook ID not name
function facebookGetUser() {
  return function(req, res, next) {
    req.facebook.getUser( function(err, user) {
      if (!user || err){
        res.render('login', { title: 'Flarghlespace' });
      } else {
        req.user = user;
        req.session.user = user;
        next();
      }
    });
  }
}

app.get('/', facebookGetUser(), function(req, res){
  req.facebook.api('/me', function(err, user) {
    userID = req.user;
    name = user.name;
    User.findOne({userID:userID}, function (err, doc) {
      if(err){
        console.log("Oops!");
      }
      if(!doc){
        console.log(name + " not found.");
        var newUser = new User({userID: userID, name: name, color: "#FFFFFF"});
        newUser.save(function (err) {
          if (err){
            return console.log("Danger Will Robinson!");
          }
          else{
            console.log("User created: " + name);
            res.redirect('/');
          }
        })
      }
      else{
        req.facebook.api('/me/friends', function(err, friends) {
            var ids = []
            var friendList = []
            for (i=0; i<friends.data.length; i++) {
                ids.push(friends.data[i].id)
                friendList.push('<img src="https://graph.facebook.com/' + ids[i] + '/picture?width=300&height=300"/>')
            }
            console.log(friendList);
            color = doc.color;
            console.log("Name: " + name + " ID: " + userID + " Color: " + color + " UID: " + user.id );
            res.render('index', { title: 'Flarghlespace', name: name, userID: userID, color: doc.color, images: friendList, ids: ids });
        });
      }
    });
  });
});
app.get('/login', Facebook.loginRequired({ scope: ['user_photos', 'friends_photos', 'publish_stream'] }), function(req, res){
  res.redirect('/');
});
app.get('/logout', facebookGetUser(), function(req, res){
  req.user = null;
  req.session.destroy();
  res.redirect('/');
});
app.post('/change', function(req, res) {
  var query = { userID: req.session.user };
  console.log("Updating...");
  User.findOneAndUpdate(query, { color: req.body.color }, function(err,doc) {
    if(err){
      console.log("Error saving color change for " + req.session.user);
    }
    if(doc){
      console.log("The color has been changed to " + req.body.color + " by User ID " + req.session.user + ".");
      res.send("Yay! Success.");
    }
  })
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
