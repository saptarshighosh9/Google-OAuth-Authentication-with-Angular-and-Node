// ********************************************
// API
// Version: 0.2
// Author : Saptarshi Ghosh
// ********************************************
var bcrypt   		= require('bcrypt-nodejs');
var path 			= require('path');
var _               = require('lodash');
var jwt  			= require('jsonwebtoken');
var request 		= require('request');
var User       		= require('./models/user');
var config 			= require('../config/database.js');
module.exports 		= function(app,db,fs) {
	app.get('/profile',isAuth,function(req,res){
		var bearerToken;
	    var bearerHeader = req.headers["authorization"];
	    if (typeof bearerHeader !== 'undefined') {
	        var bearer = bearerHeader.split(" ");
	        bearerToken = bearer[1];
	        req.token = bearerToken;
	        var decodedtoken = jwt.decode(bearerToken);
	        console.log(decodedtoken);
	        if(decodedtoken.iss=='accounts.google.com'){
				User.findOne({"g_email":decodedtoken.email},function(err,data) {
					return res.status(201).send({message:"success","info":data});
				});
	        }else if(decodedtoken.iss=='gooblu'){
				User.findOne({"email":decodedtoken.email},function(err,data) {
					return res.status(201).send({message:"success","info":data});
				});
	        }else{
	        	res.json({"message":"NA"});
	        }
	    }else{
	    	res.json({"message":"NA"});
	    };
	});
// *****************************************************************
// Login and Signup
// *****************************************************************
    //Check if user is logged in
    app.post('/loginstat',isAuth,function(req,res){
    	User.findOne({"email":req.tokeninfo.email},function(err,data){
    		if(!err){
    			res.json({"message":"success"});
    		}else{
    			res.json({"message":"NA"});
    		};
    	});    	
    });
    //User Login
	app.post('/login',function(req, res){
		if(!req.body.username || !req.body.password){
			return res.status(400).send("Must provide credentials");
		}
		User.findOne({"email":req.body.username},function(err,user){
			//var u = bcrypt.compareSync(req.body.password, user.password);
			//if(u){
			if(user && bcrypt.compareSync(req.body.password, user.password) && !err){
				console.log("success");
				return res.status(200).send({message:"success",id_token:createToken(req.body.username),username:user.pseudoname});
			}else{
				res.json({message:"NA"});
			}
		});
	});
	//Signup with email and password
	app.post('/signup',function(req, res){
		if(!req.body.user.email || !req.body.user.password){
			return res.status(400).send("Must provide credentials");
		}else{
			User.findOne({ $or :[ {"email":req.body.user.email},{"g_email":req.body.user.email},{"fb_email":req.body.user.email}]},function(err,user){
				if(!err){
					if(user){
						return res.status(200).send("User Already exist");
					}else{
						var newUser  = new User();
						newUser.email= req.body.user.email;
						newUser.password = bcrypt.hashSync(req.body.user.password, bcrypt.genSaltSync(8), null);
				        newUser.save(function(err,u) {
				            if (err)
				                throw err;
				            return res.status(201).send({message:"success",id_token:createToken(req.body.user.email)});
				        });  				
					};
				}else{
					return res.status(400).send("NA");
				};
			});
		};
	});
	// Post user registration information COllection
	app.post('/reginfo',isAuth,function(req,res){
		// Can be used for saving additional user info after registration
		res.json({message:"success"});
	});
	// Signup With Google/Login with Google
	app.post('/googlecheckin',function(req,res){
		var now = new Date();
		console.log(jwt.decode(req.body.jwt).email);
		User.findOne({"g_email":jwt.decode(req.body.jwt).email},function(err,user){
			//Skipping JWT Validation with https://www.googleapis.com/oauth2/v3/tokeninfo?id_token='+req.body.jwt
			if(user){
				User.update({"g_email":jwt.decode(req.body.jwt).email},{g_jwt:req.body.jwt},function(err,data){
					if(!err){
						res.json({"message":"success"});
					}else{
						res.json({"message":"NA"});
					}
				});		
				/*		
				request('https://www.googleapis.com/oauth2/v3/tokeninfo?id_token='+req.body.jwt, function (error, response, body) {
					if(!error && response.statusCode == 200 && jwt.decode(req.body.jwt).exp > (Date.now() / 1000 | 0)){
						User.update({"email":jwt.decode(req.body.jwt).email},{g_jwt:req.body.jwt},function(err,data){
							if(!err){
								res.json({"message":"success"});
							}else{
								res.json({"message":"NA"});
							}
						});
					}else{
						res.json({"message":"NA"});
					};
				}); */
			}else{
				User.findOne({ $or :[{"email":jwt.decode(req.body.jwt).email},{"fb_email":jwt.decode(req.body.jwt).email}]},function(err,data){
					if(data){
						// this email is used by the same person for an email login or facebook login
						res.json({"message":"NA"});
					}else{
						console.log("New user request via google.Sending dummy oauth valid call to google");
						// Dummy Code starts
						var newUser  = new User();
						newUser.g_jwt = req.body.jwt;
						newUser.g_email = jwt.decode(req.body.jwt).email;
						newUser.name = 	jwt.decode(req.body.jwt).given_name;
						newUser.image = jwt.decode(req.body.jwt).picture;
				        newUser.save(function(err,u) {
				            if (err)
				                throw err;
				            console.log("New user Saved");
				        });
				        res.json({"message":"success","ugemail":jwt.decode(req.body.jwt).email,"nuser":true});						
					};
				});
		
		        // Dummy code ends
		  		/*
				request({'url':'https://www.googleapis.com/oauth2/v3/tokeninfo?id_token='+req.body.jwt,'proxy':'http://"529215:Cadbury@0"@proxy.cognizant.com:6050'}, function (error, response, body) {
					if(error)
						console.log(error);
						res.json({"message":"NA"});
					console.log(body);
				  	if (!error && response.statusCode == 200) {
						var newUser  = new User();
						newUser.email= jwt.decode(req.body.jwt).email;
						newUser.g_jwt = req.body.jwt;
				        newUser.save(function(err,u) {
				            if (err)
				                throw err;
				        });
				  		res.json({"message":"success","ugemail":jwt.decode(req.body.jwt).email,"npw":true});
				 	}else{
				  	res.json({"message":"NA"});
				  }
				});  */
			};
		})
	});
	// Signup With Facebook/Login with Facebook
	/*
	app.post('/fbcheckin',function(req,res){
		// Dummy code
	  	//var t=JSON.parse(body);
	  	return res.status(200).send({message:"success",id_token:createfbtoken(req.body.accesstoken),"nuser":true});	
	  	//return res.status(200).send({message:"success",id_token:createfbtoken(t.email,req.body.accesstoken)});	
	  	/*	
		request('https://graph.facebook.com/me?fields=id,name,email&access_token='+req.body.accesstoken,function (error,response,body){
		  if (!error && response.statusCode == 200) {
		  	var t=JSON.parse(body);
		  	return res.status(200).send({message:"success",id_token:createfbtoken(t.email,req.body.accesstoken)});
		  }else{
		  	res.json({"message":"NA"});
		  }
		});
	});
		*/
	// Set password for native login after Oauth Signup
	app.post('/setnativepassword',isAuth,function(req,res){
	    var bearerToken;
	    var bearerHeader = req.headers["authorization"];
	    if (typeof bearerHeader !== 'undefined') {
	        var bearer = bearerHeader.split(" ");
	        bearerToken = bearer[1];
	        req.token = bearerToken;
	        var decodedtoken = jwt.decode(bearerToken);
	        console.log(decodedtoken);
			User.findOne({ $or :[{"email":req.body.email},{"fb_email":req.body.email}]},function(err,data){
				if(data){
					res.json({"message":"NA"});
				}else{
					User.update({"g_email":decodedtoken.email},{email: req.body.email,password: bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(8), null)},function(err,data){
						if(!err){
							res.json({"message":"success"});
						}else{
							res.json({"message":"NA"});
						}
					});	
				};
			});
	    }else{
	    	res.json({"message":"NA"});
	    }
	});
	// Add Google account later in my profile
	app.post('/addgoogleacc',isAuth,function(req,res){
		User.findOne({ $or :[{"g_email":jwt.decode(req.body.jwt).email},{"fb_email":jwt.decode(req.body.jwt).email}]},function(errr,dataa){
			if(dataa){
				res.json({"message":"NA"});
			}else{
				User.findOne({"email":req.tokeninfo.email},function(err,user){
					if(user){
						User.update({"email":req.tokeninfo.email},{g_email:jwt.decode(req.body.jwt).email,g_jwt:req.body.jwt,name:jwt.decode(req.body.jwt).given_name ,image:jwt.decode(req.body.jwt).picture},function(err,data){
							if(!err){
								User.findOne({"email":req.tokeninfo.email},function(err,userinfo){
									res.json({"message":"success",info:userinfo});
								});
							}else{
								res.json({"message":"NA"});
							}
						});			
						// Dummy code
				
						// Dummy code ends
						/*		
						request('https://www.googleapis.com/oauth2/v3/tokeninfo?id_token='+req.body.jwt, function (error, response, body) {
							if(!error && response.statusCode == 200 && jwt.decode(req.body.jwt).exp > (Date.now() / 1000 | 0)){
								User.update({"email":jwt.decode(req.body.jwt).email},{g_jwt:req.body.jwt},function(err,data){
									if(!err){
										res.json({"message":"success"});
									}else{
										res.json({"message":"NA"});
									}
								});
							}else{
								res.json({"message":"NA"});
							};
						}); */
					}else{
						res.json({"message":"NA"});
					}
				});			
			};
		});
	});
	// Add facebook account later in my profile
	app.post('/addfacebookacc',isAuth,function(req,res){
	});
};
// *****************************************************************
// Functions
// *****************************************************************
// Create Random Score for new posts
function randomInt (low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}
// Create token for native login
function createToken(user){
	return jwt.sign({"email":user,"iss":"gooblu"},config.secret,{ expiresIn: "2 days"});
}
// Get token for Facebook Login
function createfbtoken(user,accesstoken){
	return jwt.sign({"accesstoken":accesstoken,"iss":"facebook.com"},config.secret,{ expiresIn: "2 days"});
	//return jwt.sign({"email":user,"accesstoken":accesstoken,"iss":"facebook.com"},config.secret,{ expiresIn: "2 days"});
}
// Express Middleware function for Token verfication
function isAuth(req, res, next) {
    var bearerToken;
    var bearerHeader = req.headers["authorization"];
    if (typeof bearerHeader !== 'undefined') {
        var bearer = bearerHeader.split(" ");
        bearerToken = bearer[1];
        req.token = bearerToken;
        var decodedtoken = jwt.decode(bearerToken);
        if(decodedtoken.iss=='accounts.google.com'){
        	// Dummy code
        	req.tokeninfo = decodedtoken;
        	next();
        	/*

			request('https://www.googleapis.com/oauth2/v3/tokeninfo?id_token='+bearerToken, function (error, response, body) {
			  if (!error && response.statusCode == 200) {
			  	req.tokeninfo = body;
			    next();
			  }
			});       
			*/ 	
        }else if(decodedtoken.iss=="gooblu"){
			jwt.verify(bearerToken, config.secret,function(err,decoded){
				if(err){
					res.send(403);
				};
				req.tokeninfo = decodedtoken;
				next();
			});
        }else if(decodedtoken.iss=="facebook.com"){
        	req.tokeninfo = decodedtoken;
        	next();
        	/*
			request('https://graph.facebook.com/me?fields=id,name,'+decodedtoken.email+'&access_token='+decodedtoken.accesstoken,function (error,response,body){
				if(error){
					res.send(403);
				};
				req.tokeninfo = body;
				next();
			});
			*/
        }else{
        	res.send(403);
        };
    } else {
        res.send(403);
    }
};