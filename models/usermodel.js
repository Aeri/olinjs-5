var mon = require('mongoose')

var userSchema = mon.Schema({
  userID: String,
  name: String,
  color: String,
});

var User = mon.model('User', userSchema);

exports.User = User;