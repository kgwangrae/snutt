"use strict";
var Lecture = function (options) {
  options = options || {};
  this.classification = options.classification;
  this.department = options.department;
  this.academic_year = options.academic_year;
  this.course_number = options.course_number;
  this.lecture_number = options.lecture_number;
  this.course_title = options.course_title || "";
  this.credit = options.credit;
  this.class_time = options.class_time;
  this.location = options.location;
  this.instructor = options.instructor;
  this.quota = options.quota;
  this.enrollment = options.enrollment;
  this.remark = options.remark;
  this.category = options.category || "";
  this.snuev_lec_id = options.snuev_lec_id || "";
  this.snuev_eval_score = parseFloat(options.snuev_eval_score);
};

module.exports.Lecture = Lecture;
