var mongoose = require('mongoose');
// define the schema for our user model
var userSchema = mongoose.Schema({
	email : String,
	fb_email: String,
	g_email : String,
	password : String,
	fb_access_token : String,
	google_jwt : String,
	image : String
});
module.exports = mongoose.model('User', userSchema);
