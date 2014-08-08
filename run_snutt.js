// dependencies
var url = require('url');
var path = require('path');
var fs = require('fs');
var mime = require('mime');
var deparam = require('node-jquery-deparam');
var Router = require('routes');
var mkdirp = require('mkdirp');
var _ = require("underscore");

// config
var config = require('./config.js');

// make directories if not exist
mkdirp.sync(config.snutt.USER_IMAGE_PATH);
mkdirp.sync(config.snutt.USER_TIMETABLE_PATH);

// load model
var NaiveLectureModel = require('./model/naive_snutt_data.js').NaiveLectureModel;
var lectureModel = new NaiveLectureModel();
lectureModel.init();

// load controllers
var controllers = require('./controllers/controllers.js').functor(config, "snutt", lectureModel);

// define application
var port = process.env.PORT || 3784;
var app = require('http').createServer(handler);
app.listen(port);
console.log("Listening on " + port);

// register router
var router = Router();
// api
router.addRoute("/api/init_client", controllers.api_controller.initClient);
router.addRoute("/api/search_query?", controllers.api_controller.searchQuery);
router.addRoute("/api/export_timetable?", controllers.api_controller.exportTimetable);
router.addRoute("/api/publish_to_facebook", controllers.api_controller.publishToFacebook)
// views
router.addRoute("/", controllers.home_controller.home);
router.addRoute("/user/:id", controllers.home_controller.show);

//http server handler
function handler (req, res) { 
	var uri = url.parse(req.url).pathname;
	var params = deparam(url.parse(req.url).query);
	var renderer = {
        json:  function(hash) {
            res.writeHead(200, {"Content-Type": "application/json"});
            res.end(JSON.stringify(hash));
        },
        text: function(text) {
            res.writeHead(200, {'Content-Type' : "text/html"});
            res.end(text);
        }
    };

	// router
	var route = router.match(uri);
	if (route) {
		_.extend(params, route.params);
		route.fn.apply(null, [params, renderer, req]);
	} else {
		var filename = path.join(process.cwd(), uri);
		fs.readFile(config.ROOT_PATH + uri, function(err, data){
			if (err){
				res.writeHead(404);
				return res.end("ERROR");
			}
			//write header
			var filestat = fs.statSync(filename);
			var filemime = mime.lookup(filename);
			res.writeHead(200, {
				'Content-Type' : filemime,
				'Content-Length' : filestat.size
			});
			res.end(data);
		});
	}
}
