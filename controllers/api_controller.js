var restler = require('restler');
var utils = require('../utils');

var safeString = utils.safeString;
var objectToString = utils.objectToString;

function functor(config, target, lectureModel) {
  return {
    initClient: function(params, renderer, request) {
      renderer.json({
        test: 'test',
        coursebook_info: lectureModel.getCoursebookInfo(),
        last_coursebook_info: lectureModel.getLastCoursebookInfo()
      });
    },
    searchQuery: function(params, renderer, request) {
      renderer.json(lectureModel.getLectures(params));
    },
    exportTimetable: function(params, renderer, request) {
      var lectures = params.my_lectures;
      var year = params.year;
      var semester = params.semester;
      for(var i = 0; i < lectures.length ; i++)
      {
        lectures[i].course_number = lectures[i].course_number.replace("$","");
        lectures[i].lecture_number = lectures[i].lecture_number.replace("$","");
      }
      console.log("Trying to export timetable at");
      console.log(new Date().getTime());
      lectureModel.save(lectures, year, semester, function(err, id) {
        if (err) {
          renderer.json({error: err});
        } else {
          renderer.json({filename: id});
        }
        console.log("callback function finished at");
        console.log(new Date().getTime());
      });
      lectureModel.savebycookie(lectures, year, semester,renderer.cookies, function(err, id) {
        if (err) {
          renderer.json({error: err});
        }
      });
    },
    publishToFacebook: function(options, renderer, request) {
      //access_token, base64_data, message
      options = options || {};
      var access_token = options.access_token;
      var base64_data = options.base64_data;
      var message = options.message.toString('utf8');
      message = message + "\nhttp://" + request.headers.host;

      var filename = config[target].USER_IMAGE_PATH + '/' + String((new Date()).getTime()) + "_" + Math.floor(Math.random() * 10000) + ".png";
      var base64Image = base64_data.toString('base64');
      var decodedImage = new Buffer(base64Image, 'base64');
      fs.writeFile(filename, decodedImage, function(err){
        if (err) {
          renderer.json({data:{error:"file save error"}});
          console.log(err);
        } else {
          var target_url = 'https://graph.facebook.com/me/photos?message='+encodeURIComponent(message)+'&access_token=' + access_token;
          restler.post(target_url, {
            multipart: true,
            encoding:"utf8",
            data: {
              source: restler.file(filename)
            }
          }).on('complete', function(data) {
            console.log("photo upload complete! : " + filename);
            renderer.json({data: data});
          });
        }
      });
    }
  };
}


module.exports = {
  functor: functor
};
