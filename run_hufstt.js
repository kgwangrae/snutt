// config
GLOBAL.TARGET = 'hufstt';

GLOBAL.ROOT_PATH = __dirname;
GLOBAL.ROOT_VIEW_PATH = ROOT_PATH + '/views/' + TARGET;
GLOBAL.ROOT_DATA_PATH = ROOT_PATH + '/data/' + TARGET;
GLOBAL.USER_IMAGE_PATH = ROOT_PATH + '/userdata/' + TARGET + '/images';
GLOBAL.USER_TIMETABLE_PATH = ROOT_PATH + '/userdata/' + TARGET + '/timetables';

// load initializers
require('./initializers/load_modules.js');
require('./initializers/load_common_utils.js');
mkdirp.sync(USER_IMAGE_PATH);
mkdirp.sync(USER_TIMETABLE_PATH);
require('./initializers/load_data_' + TARGET + '.js');

// load controllers
var controllers = require('./controllers/controllers.js');

// define application
var port = process.env.PORT || 3785;
var app = require('http').createServer(handler);
app.listen(port);
console.log("Listening on " + port);

// register router
var router = Router();
// api
router.addRoute("/api/init_client", controllers.api_controller.init_client);
router.addRoute("/api/search_query?", controllers.api_controller.search_query);
router.addRoute("/api/export_timetable?", controllers.api_controller.export_timetable);
router.addRoute("/api/publish_to_facebook", controllers.api_controller.publish_to_facebook)
// views
router.addRoute("/", controllers.home_controller.home);
router.addRoute("/user/:id", controllers.home_controller.show);

function handler (req, res) { //http server handler
	var uri = url.parse(req.url).pathname;
	var params = deparam(url.parse(req.url).query);
	var renderer = new Renderer(res);

	// router
	var route = router.match(uri);
	if (route){
		_.extend(params, route.params);
		route.fn.apply(null, [params, renderer, req]);
	}
	else {
		var filename = path.join(process.cwd(), uri);
		fs.readFile(ROOT_PATH + uri, function(err, data){
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
