var fs = require("fs");
var utils = require("../utils.js");

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
    functor: function(config, target, lectureModel) {
        var timetable_header = fs.readFileSync(config[target].ROOT_VIEW_PATH + "/timetable_header.htm");
        var timetable_footer = fs.readFileSync(config[target].ROOT_VIEW_PATH + "/timetable_footer.htm");
        var user_timetable_header = fs.readFileSync(config[target].ROOT_VIEW_PATH + "/user_timetable_header.htm");
        var user_timetable_footer = fs.readFileSync(config[target].ROOT_VIEW_PATH + "/user_timetable_footer.htm");

        return {
            home: function(params, renderer, request) {
							//Only for rapid development. delete before release
							var timetable_header = fs.readFileSync(config[target].ROOT_VIEW_PATH + "/timetable_header.htm");
							var timetable_footer = fs.readFileSync(config[target].ROOT_VIEW_PATH + "/timetable_footer.htm");
							var user_timetable_header = fs.readFileSync(config[target].ROOT_VIEW_PATH + "/user_timetable_header.htm");
							var user_timetable_footer = fs.readFileSync(config[target].ROOT_VIEW_PATH + "/user_timetable_footer.htm");
                if ("user" in params) {
                    id = params.user;
                    lectureModel.load(params.user, function (err, loaded_info) {
                        if (err) {
														console.log('Error while showing home');
                            renderer.text('ERROR');
                        } else {
                            renderer.text(timetable_header + payload_template(loaded_info) + timetable_footer);
                        }
                    });
                } else if(renderer.cookies.get("my_lecture")){
                    var loaded_info = stringToObject(renderer.cookies.get("my_lecture"));
                    renderer.text(timetable_header + payload_template(loaded_info) + timetable_footer);
                } else {
                    renderer.text(timetable_header + timetable_footer);
                }
            },
            show: function(params, renderer, request) {
                // 저장된 시간표 불러오기 (보기모드)
								//Only for rapid development. delete before release
								var timetable_header = fs.readFileSync(config[target].ROOT_VIEW_PATH + "/timetable_header.htm");
								var timetable_footer = fs.readFileSync(config[target].ROOT_VIEW_PATH + "/timetable_footer.htm");
								var user_timetable_header = fs.readFileSync(config[target].ROOT_VIEW_PATH + "/user_timetable_header.htm");
								var user_timetable_footer = fs.readFileSync(config[target].ROOT_VIEW_PATH + "/user_timetable_footer.htm");
                lectureModel.load(params.id, function (err, loaded_info) {
                    if (err) {
												console.log('Error while showing table');
                        renderer.text('ERROR');
                    } else {
                        renderer.text(timetable_header + payload_template(loaded_info) + timetable_footer);
                    }
                });
            }
        };
     }
};
