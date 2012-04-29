//DEFINE ARRAY FUNCTIONALITIES
Array.prototype.remove = function(ele){
	var index = this.indexOf(ele);
	if (index != -1)
		this.splice(index, 1);
	return index;
}
Array.prototype.removeIndex = function(index){
	if (index >= 0 && index < this.length){
		this.splice(index, 1);
		return true;
	}
	return false;
}
Array.prototype.find = function(ele){
	var index = this.indexOf(ele);
	if (index == -1)
		return null;
	return ele;
}

Array.prototype.clone = function(){
  var newObj = (this instanceof Array) ? [] : {};
  for (i in this) {
    if (i == 'clone') continue;
    if (this[i] && typeof this[i] == "object") {
      newObj[i] = this[i].clone();
    } else newObj[i] = this[i]
  } return newObj;
};

//Lecture object
function Lecture(options){
	options = options ||{};
	this.classification = options["classification"];
	this.department = options["department"];
	this.academic_year = options["academic_year"];
	this.course_number = options["course_number"];
	this.lecture_number = options["lecture_number"];
	this.course_title = options["course_title"] || "";
	this.credit = options["credit"];
	this.class_time = options["class_time"];
	this.location = options["location"];
	this.instructor = options["instructor"];
	this.quota = options["quota"];
	this.enrollment = options["enrollment"];
	this.remark = options["remark"];
	this.category = options["category"];
}


function sortASC(a, b){return a-b};

var app = require('http').createServer(handler),
		url = require('url'),
		path = require('path'),
		io = require('socket.io').listen(app),
		fs = require('fs'),
		mime = require('mime'),
		restler = require('restler');
		utils = require('./utils.js');

io.set('log level', 1); //reduce log level

//GLOBAL VARIABLES
var lectures = [];

function init_data()
{
	var datapath = __dirname + "/data/data.txt";
	fs.readFile(datapath, function(err, data){
		if (err){
			console.log('INIT FAIL');
			process.kill();
		}
		var lines = data.toString().split("\n");
		var header = lines[0].split(";");
		for (var i=1;i<lines.length;i++){
			var line = lines[i];
			var options = {};
			var components = line.split(";");
			for (var j=0;j<components.length;j++){
				options[header[j]] = components[j];
			}
			lectures.push(new Lecture(options));
		}
		console.log('init finished');
	});

	//timetable_images 폴더가 없으면 생성
	var stats = fs.stat('timetable_images', function(err, stats){
		if (err){
			fs.mkdir('timetable_images');
		}
	});
}
init_data();

var port = process.env.PORT || 3784;
app.listen(port);
console.log("Listening on " + port);

function handler (req, res) { //http server handler 
	var uri = url.parse(req.url).pathname; 
	var filename = path.join(process.cwd(), uri);
	var user_agent = req.headers['user-agent'];
	var not_support = (/msie 6.0/i.test(user_agent)) || (/msie 7.0/i.test(user_agent)) || (/msie 8.0/i.test(user_agent));

	//supporting browser
	if (uri == "/"){
		//not supporting browser
		if (not_support){
			fs.readFile(__dirname + "/not_support.htm", function(err, data){
				if (err){
					res.writeHead(200);
					return res.end("ERROR");
				}
				res.writeHead(200, {'Content-Type' : mime.lookup(__dirname + "/not_support.htm")});
				res.end(data);
			});
		}
		else{
			fs.readFile(__dirname + "/timetable.htm", function(err, data){
				if (err){
					res.writeHead(200);
					return res.end("ERROR");
				}
				res.writeHead(200, {'Content-Type' : mime.lookup(__dirname + "/timetable.htm")});
				res.end(data);
			});
		}
	}
	else{
		fs.readFile(__dirname + uri, function(err, data){
			if (err){
				res.writeHead(200);
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

function s(str)
{
	return str || "";
}

function filter_check(lecture, filter)
{
	if (!filter) return true;
	//학년
	if (filter.academic_year){
		var result = false;
		for (var i=0;i<filter.academic_year.length;i++){
			var academic_year = filter.academic_year[i];
			if (academic_year == "1" && lecture.academic_year == "1학년") result = true;
			if (academic_year == "2" && lecture.academic_year == "2학년") result = true;
			if (academic_year == "3" && lecture.academic_year == "3학년") result = true;
			if (academic_year == "4" && (lecture.academic_year == "4학년" || lecture.academic_year == "5학년")) result = true;
			if (academic_year == "5" && (lecture.academic_year == "석사" || lecture.academic_year == "박사" || lecture.academic_year == "석박사")) result = true;
		}
		if (!result) return false;
	}
	//학점
	if (filter.credit){
		var result = false;
		for (var i=0;i<filter.credit.length;i++){
			var credit = filter.credit[i];
			if (credit == "1" && lecture.credit == "1") result = true;
			if (credit == "2" && lecture.credit == "2") result = true;
			if (credit == "3" && lecture.credit == "3") result = true;
			if (credit == "4" && lecture.credit == "4") result = true;
			if (credit == "5" && parseInt(lecture.credit) >= 5) result = true;
		}
		if (!result) return false;
	}
	//학문의기초, 핵심교양, 기타는 OR 연산
	if (!filter.basics && !filter.core && !filter.etc) return true;
	var result = false;
	//학문의 기초
	if (filter.basics){
		for (var i=0;i<filter.basics.length;i++){
			var basics = filter.basics[i];
			if (basics == lecture.category) result = true;
		}
	}
	//핵심교양
	if (filter.core){
		for (var i=0;i<filter.core.length;i++){
			var core = filter.core[i];
			if (core == lecture.category) result = true;
		}
	}
	//기타
	if (filter.etc){
		for (var i=0;i<filter.etc.length;i++){
			var etc = filter.etc[i];
			if (etc == "teaching" && lecture.classification == "교직") result = true;
			if (etc == "exercise" && lecture.category == "normal_exercise") result = true;
			if (etc == "etc" && lecture.category != "normal_exercise" && lecture.category.indexOf('normal') != -1) result = true;
		}
	}
	return result;
}

function get_lectures(query)
{
	var page = query.page || 1;
	var per_page = query.per_page || 30;
	var filter = query.filter;
	var result = {lectures:[], page:page, per_page:per_page, query:query};

	//console.log(query);
	//교과목명으로 검색
	if (query.type == "course_title"){
		var title = query.query_text;
		var skip_count = 0;
		for (var i=0;i<lectures.length;i++){
			//if (permutation_inclusion(lectures[i].course_title, title)){
			if (increasing_order_inclusion(lectures[i].course_title, title) && filter_check(lectures[i], filter)){
				if (skip_count < per_page * (page-1))
					skip_count++;
				else{
					result.lectures.push(lectures[i]);
				}
			}
			if (result.lectures.length >= per_page) break;
		}
		return result;
	}
	//교수명으로 검색
	else if (query.type == "instructor"){
		var instructor = query.query_text.replace(/ /g, "").toLowerCase();
		var skip_count = 0;
		for (var i=0;i<lectures.length;i++){
			var lecture_instructor = s(lectures[i].instructor).replace(/ /g, "").toLowerCase();
			if (lecture_instructor.indexOf(instructor) != -1 && filter_check(lectures[i], filter)){
				if (skip_count < per_page * (page-1))
					skip_count++;
				else{
					result.lectures.push(lectures[i]);
				}
			}
			if (result.lectures.length >= per_page) break;
		}
		return result;
	}
	//교과목번호로 검색
	else if (query.type == "course_number"){
		var course_number = query.query_text.replace(/ /g, "").toLowerCase();
		var skip_count = 0;
		for (var i=0;i<lectures.length;i++){
			var lecture_course_number = (s(lectures[i].course_number)+s(lectures[i].lecture_number)).replace(/ /g, "").toLowerCase();
			if (lecture_course_number.indexOf(course_number) != -1 && filter_check(lectures[i], filter)){
				if (skip_count < per_page * (page-1))
					skip_count++;
				else{
					result.lectures.push(lectures[i]);
				}
			}
			if (result.lectures.length >= per_page) break;
		}
		return result;
	}
	//수업교시로 검색
	else if (query.type == "class_time"){
		var class_times = query.query_text.replace(/ /g, "").split(',');
		var skip_count = 0;
		for (var i=0;i<lectures.length;i++){
			var lecture_class_times = s(lectures[i].class_time).split(',');
			//강의시간 사이에 검색시간이 존재하면 추가
			if (class_times_check(lecture_class_times, class_times) && filter_check(lectures[i], filter)){
				if (skip_count < per_page * (page-1))
					skip_count++;
				else{
					result.lectures.push(lectures[i]);
				}
			}
			if (result.lectures.length >= per_page) break;
		}
		return result;
	}
	//개설학과로 검색
	else if (query.type == "department"){
		var department = query.query_text;
		var skip_count = 0;
		for (var i=0;i<lectures.length;i++){
			if (increasing_order_inclusion(lectures[i].department, department) && filter_check(lectures[i], filter)){
				if (skip_count < per_page * (page-1))
					skip_count++;
				else{
					//비고에 개설학과 추가
					var tmp_lecture = {};
					for (var key in lectures[i])
						tmp_lecture[key] = lectures[i][key];
					tmp_lecture.remark = tmp_lecture.department + "/" + tmp_lecture.remark;
					result.lectures.push(tmp_lecture);
				}
			}
			if (result.lectures.length >= per_page) break;
		}
		return result;
	}
}

//[월3-2, 수3-2], [월3, 화3]
function class_times_check(lecture_class_times, search_class_times)
{
	for (var i=0;i<lecture_class_times.length;i++){
		for (var j=0;j<search_class_times.length;j++){
			if (class_time_check(lecture_class_times[i], search_class_times[j]))
				return true;
		}
	}
	return false;
}

//search_class_time이 lecture_class_time 사이에 존재하는가.
//월3-2, 월4
function class_time_check(lecture_class_time, search_class_time)
{
	if (search_class_time == "") return true;
	var lecture_wday = lecture_class_time[0];
	var lecture_start_time = parseFloat(lecture_class_time.replace(/[()]/g, "").split("-")[0].slice(1));
	var lecture_duration = parseFloat(lecture_class_time.replace(/[()]/g, "").split("-")[1]);
	var search_wday = search_class_time[0];
	var search_time = parseFloat(search_class_time.slice(1));
	if (isNaN(search_time) && search_class_time.length != 1) return false; //입력방식 오류
	if (isNaN(search_time))
		return (lecture_wday == search_wday);

	return (lecture_wday == search_wday && (lecture_start_time <= search_time && search_time < lecture_start_time + lecture_duration));
}

io.sockets.on('connection', function (socket) {
	socket.emit('init_client', {message:"Hello world!"});
	socket.on('search_query', function(data){
		socket.emit('search_result', get_lectures(data));
	});
	socket.on('publish_timetable_to_facebook', function(data){
		upload_timetable_to_facebook(data, socket);
	});
});

//b's elements are members of a's elements with increasing order
function increasing_order_inclusion(a,b)
{
	a = s(a).replace(/ /g, "").toLowerCase();
	b = s(b).replace(/ /g, "").toLowerCase();
	var i=0,j=0;
	while (i<a.length && j<b.length){
		if (a[i] == b[j]) j++;
		else i++;
	}
	return (j == b.length);
}

//b's elements are members of a's elements (a>b)
function permutation_inclusion(a, b)
{
	a = a.replace(/ /g, "").toLowerCase();
	b = b.replace(/ /g, "").toLowerCase();
	for(var i=0;i<b.length;i++){
		var flag = true;
		for (var j=0;j<a.length;j++){
			if (b[i] == a[j]){
				flag = false;
				break;
			}
		}
		if(flag) return false;
	}
	return true;
}

//access_token, base64_data, message
function upload_timetable_to_facebook(options, socket)
{
	var options = options || {};
	var access_token = options.access_token;
	var base64_data = options.base64_data;
	var message = options.message.toString('utf8');
	message = message + "\nhttp://choco.wafflestudio.net:3784"

	var image_path = save_timetable_image(base64_data);
	var target_url = 'https://graph.facebook.com/me/photos?message='+encodeURI(message)+'&access_token=' + access_token;
	restler.post(target_url, {
		multipart: true,
		encoding:"utf8",
		data: {
			source: restler.file(image_path, null, null, null, 'image/png')
		}
	}).on('complete', function(data) {
		console.log("photo upload complete! : " + image_path);
		console.log(data);
		socket.emit('facebook_publish_complete', {data:JSON.parse(data)});
	});
}


function save_timetable_image(base64_data)
{

	var filename = 'timetable_images/' + String((new Date()).getTime()) + "_" + Math.floor(Math.random() * 10000) + ".png";
	var base64Image = base64_data.toString('base64');
	var decodedImage = new Buffer(base64Image, 'base64');
	fs.writeFile(filename, decodedImage, function(err) {});

	return filename;
}
