/**********
 * app.js *
 *********/

// Setup things
var express = require('express');
var app = express();
var port = process.env.PORT || 5000;
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

app.use(bodyParser());
app.use(cookieParser());


// View engine
var expressHbs = require('express3-handlebars');

hbs = expressHbs.create({
	defaultLayout:	'main',
	extname:		'.html',
	layoutsDir:		'views/layouts/',
	partialsDir:	'views/partials'
});
app.engine('html', hbs.engine);
app.set('view engine', 'html');


// Database
var mongoose = require('mongoose');
var ObjectID = mongoose.Types.ObjectId;
mongoose.connect('mongodb://whisper:happy@ds035498.mongolab.com:35498/whisper');

// Database model
var Thread = mongoose.model('Thread', {
	content: String,
	comments: [],
	date : String,
	like : Number,
	dislike : Number,
	groupID: String
});

var ThreadLike = mongoose.model('ThreadLike', {
	threadId: String,
	ip: String
});

var Group = mongoose.model('Group', {
	groupname: String,
	latitude: Number,
	longitude: Number
});

var User = mongoose.model('User', {
	username: String,
	password: String
});

 // Routes
// app.get('/', function(req, res) {
// 	res.render('index');
// });

app.get('/nearbypost', function(req,res){

	console.log('Iam in nearbypost get');
	res.render('nearbypost');
});

var currentgeo;

app.post('/nearbypost', function(req, res){
	currentgeo = req.body;
	console.log('I am in nearbypost post', currentgeo);

	Group.find({}, null, function(err, groups) {
		if(err) console.error(err);
		var postSearchResult = [];
		var groupsToSearch = [];
		console.log('found groups', groups.length);
		for( var i = 0; i < groups.length; i++) {
			var group = groups[i];

			var lonDiff = currentgeo.longitude - group.longitude;
			var latDiff = currentgeo.latitude - group.latitude;

			if( Math.abs(lonDiff) < 0.0100 && Math.abs(latDiff) < 0.0100){
				console.log('adding group',group._id);
				groupsToSearch.push(group._id);
			} else {
				console.log('skipping group');
			}
		}
		console.log('groups to search: ',groupsToSearch);

		Thread.find({ groupID : {$in: groupsToSearch} } , null, function(err, threads){
			// console.log(threads);
			res.json(threads);	
			/*	
			if(err) console.err('err finding posts');
			for(var i in threads){
				if(!threads.hasOwnProperty(i)) continue;
				postSearchResult.push(threads[i]);	
			}
			*/
		});
		/*

		console.log(postSearchResult);
		res.json(postSearchResult);
		*/
	});
})

app.post('/like', function(req, res){
	var postId = req.body.postId;
	// console.log('liking ost id', postId);
	Thread.findById(postId, function(err, thread){
		if (err) {
			console.log('error:',err);
		}
		if (!thread.like) {
			thread.like = 0;
		}
		thread.like = thread.like + 1;
		thread.save(function(err){
			// console.log('responding',thread);
			res.json(thread.like);
		});
	});
});

app.get('/nearbygroup', function(req,res){
	console.log('I\'m in search groups');
	res.render('nearbygroup');
});


app.post('/nearbygroup', function(req, res){

	currentgeo = req.body;

	Group.find({}, null, function(err, groups) {
		if(err) console.error(err);
		var queryResult = [];
		for(var key in groups) {
			if(!groups.hasOwnProperty(key)) continue;
			var lonDiff = currentgeo.longitude - groups[key].longitude;
			var latDiff = currentgeo.latitude - groups[key].latitude;

			if( Math.abs(lonDiff) < 0.0100 && Math.abs(latDiff) < 0.0100){
				queryResult.push({name:groups[key].groupname, id:groups[key]._id});
			}
		}
		res.json(queryResult);
	});
})


// app.get('/nearbygroup/:list', function(req,res){
// 	console.log(req.param.list);
// 	console.log('I\'m in get');
// 	res.render('nearbygroup');
// });


app.get('/creategroup', function(req, res){
	res.render('creategroup');
});

app.post('/creategroup', function(req, res){
	var obj = {};

	var data = req.body;
	console.dir(req.body);
	var groupname = data['creategroup'];
	var newGroup = new Group({
		groupname: groupname,
		latitude: data.latitude,
		longitude: data.longitude
	});

	newGroup.save(function(err){
		if(err) console.err(err);
		console.log('Groups successfully added')
	})

	res.redirect('/creategroup');
})

// not in view// in comment
app.get('/comment/:id', function(req, res) {
	var id = req.params.id;
	Thread.findById(id, function(err, thread) {
		if(err) console.error(err);
		var c = thread.comments;
		res.render('comment', {id: id, content: thread.content, comments: c});
	});
});

//related to ajax
app.get('/commentJSON/:id', function(req, res) {
	var id = req.params.id;
	// console.log('id',id);
	Thread.findById(id, function(err, thread) {
		if(err) console.error(err);
		// console.log('found thread',thread);
		var c = thread.comments;
		console.log(c);
		res.json( {id: id, content: thread.content, comments: c});

	});
});


app.post('/commentJSON/:id', function(req, res) {
	var data = req.body;
	var id = new ObjectID(data.id);  ////why make object id
	var comment = data.comment;
	var date = new Date();

	Thread.update({_id: id}, {$push: {comments: comment}}, {}, function(err, result) {
		console.log('result:', result);
	});
});


app.post('/comment', function(req, res) {
	var data = req.body;
	var id = new ObjectID(data.id);
	var comment = data.comment;
	var date = new Date();

	Thread.update({_id: id}, {$push: {comments: comment}}, {}, function(err, result) {
		res.redirect('/comment/'+id);
	});
});

// app.get('/exampleJSON', function(req, res){
// 	res.json( {comments: [
// 		  {text: 'abcdef', date: new Date()},
// 		  {text: 'ghijklmn', date: new Date()},
// 		]} );
// });

app.get('/view/:id', function(req, res) {
	console.log(req.params.id);

	var showDate = function(date){
		var postDate = new Date(date);
		var diff = new Date() - postDate;
		console.log(diff);
		var divided = [604800000, 86400000, 3600000, 60000, 1000]
   		var dateValue = ['w', 'd', 'h', 'm', 's']
   		var show;
		for(var i = 0; i< divided.length ; i++){
			if(diff <= 1000) { 
				show = 'just now'
				break;
			} else { 
				if(diff > divided[i]){
				show = Math.ceil(diff/divided[i]) + dateValue[i];
				show = show + " ago"
				break;
				}	
			};
		};
		return show;	
	};

	// Find all data, and render it
	Thread.find({groupID: req.params.id }, null, {sort: {date:-1}}, function(err, threads) {
		if(err) console.error(err);
		var groupid;
		for(key in threads) {
			if(threads.hasOwnProperty(key)) {
				threads[key]['showDate'] = showDate(threads[key].date);
				groupid = threads[key].groupID;
				console.log('asdfaf');
			}
		}

		Group.findOne({_id: req.params.id}, function(err, group) {
			// console.dir(threads);
			console.log(groupid, group.groupname);
			res.render('view', {thread: threads, groupID: req.params.id, groupname: group.groupname});
		});
	});	
});

app.post('/postatview', function(req, res){
	var data = req.body;
	console.log(data);

	var content = data['content'];
	var date = new Date();
	var groupid = data['groupid'];

	// Make new data from model and save it
	var newThread = new Thread({
		date : date,
		content: content,
		comments: [],
		groupID: groupid,
		like: 0,
		dislike: 0
	});
	newThread.save(function(err) {
		if(err) console.error(err);
		console.log('Data successfully added');
	});


	res.redirect('/view/'+data.groupid);
})


app.get('/post', function(req, res) {
	res.render('post');
});

app.post('/post', function(req, res) {
	// Read data from form
	var data = req.body;	// this is where 'bodyParser' is used

	var content = data['content'];
	var date = new Date();
	// Make new data from model and save it
	var newThread = new Thread({
		date : date,
		content: content,
		comments: [],
		like: 0,
		dislike: 0
	});
	newThread.save(function(err) {
		if(err) console.error(err);
		console.log('Data successfully added');
	});

	// Redirect
	res.redirect('/view');
});

app.use(express.static(__dirname + '/public'));


// Fire up the server
app.listen(5000);
console.log("Launched on port %d", port);