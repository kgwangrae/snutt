var fs = require("fs");
var ejs = require("ejs");
var utils = require("../utils.js");
var url = require("url");

var stringToObject = utils.stringToObject;
var objectToString = utils.objectToString;
var safeString = utils.safeString;
var _ = require('underscore');

function payload_template(options) {
  /* Arguments -
   *     lectures
   *     year
   *     semester
   */
  // 시간표 짜기
  var my_lectures = options.lectures;
  var content = "var current_year = '" + options.year + "';\n";
  content += "var current_semester = '" + options.semester + "';\n";
  content += "var my_lectures = [";

  var acc = "";
  var join = function (str) {
    if(!acc) {
      acc += str;
    } else {
      acc += "," + str;
    }
  };

  _.each(my_lectures, function (lec) {
    lec.location = safeString(lec.location);
    lec.class_time = safeString(lec.class_time);
  });
  _.each(my_lectures, function (lec) {
    join(objectToString(lec));
  });

  content += acc;
  content += "];\n";

  return content;
}

module.exports = {
  //TODO : implement non-blocking code
  functor: function(config, target, lectureModel) {
    var view_path = config[target].ROOT_VIEW_PATH;
    var timetable_header = fs.readFileSync(view_path + "/timetable_header.htm");
    var timetable_footer = ejs.render(fs.readFileSync(view_path + "/timetable_footer.ejs.htm", 'utf8'),
        {filename: view_path + "/timetable_footer.ejs.htm"});
    var user_timetable_header = fs.readFileSync(view_path + "/user_timetable_header.htm");
    var user_timetable_footer = fs.readFileSync(view_path + "/user_timetable_footer.htm");

    return {
      home: function(params, renderer, request) {
        if ("user" in params) {
          id = params.user;
          lectureModel.load(params.user, function (err, loaded_info) {
            if (err) {
              console.log('Error while showing home');
              renderer.text('ERROR');
            } 
            else {
              renderer.text(timetable_header + payload_template(loaded_info) + timetable_footer);
            }
          });
        } 
        else if(renderer.cookies.get("my_lecture")) {
          var loaded_info = stringToObject(renderer.cookies.get("my_lecture"));
          renderer.text(timetable_header + payload_template(loaded_info) + timetable_footer);
        } 
        else {
          renderer.text (timetable_header + timetable_footer);
        }
      },

      member: function (params, renderer, request) {
        //Note : older node versions doesn't support object type as an options argument
        //Just use toString() to convert buffers into String
        fs.readFile (view_path + "/members.ejs.htm", 'utf8', function (err, data) {
          if (err) {
            console.log(err);
            return renderer.err();
          }
          renderer.text (timetable_header + ejs.render(data));
        });
      },

      //Supports only png (because jpg does not support transparency)
      image: function (params, renderer, request) {
        var image_path = config[target].IMAGE_PATH;
        if (!params.path2) image_path += ('/' + params.path1);
        else image_path += ('/' + params.path1 + '/' + params.path2);

        fs.readFile (image_path, function (err, data) {
          if (err) {
            console.log(err);
            return renderer.err();
          }
          renderer.image(data, 'png');
        });
      },

      show: function(params, renderer, request) {
        // 저장된 시간표 불러오기
        lectureModel.load(params.id, function (err, loaded_info) {
          if (err) {
            console.log('Error while showing table');
            renderer.text('ERROR');
          } 
          else {
            renderer.text(timetable_header + payload_template(loaded_info) + timetable_footer);
          }
        });
      }
    };
  }
};
