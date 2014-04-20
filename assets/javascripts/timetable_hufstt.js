//강의계획서 보기
function course_detail_plan_button_handler(){
	var ele = $(this);
	show_course_detail({
		year:current_year,
		semester:current_semester,
		sector_char: ele.attr('sector-char'),
		course_number:ele.attr('course-number')
	});
}

function set_dropdown_handler(){
	//search type 설정
	//교과목명
	$('#stype_course_title').click(function(){
		$('#stype_dropdown_label').text("교과목명");
		$('#search_query_text').attr('placeholder', "예) 경원");
		search_type = "course_title";
		$('#search_query_text').focus().val("");
	});
	//교수명
	$('#stype_instructor').click(function(){
		$('#stype_dropdown_label').text("교수명");
		$('#search_query_text').attr('placeholder', "예) 최영석");
		search_type = "instructor";
		$('#search_query_text').focus().val("");
	});
	//학수번호
	$('#stype_course_number').click(function(){
		$('#stype_dropdown_label').text("학수번호");
		$('#search_query_text').attr('placeholder', "예) D02103301");
		search_type = "course_number";
		$('#search_query_text').focus().val("");
	});
	//수업교시
	$('#stype_class_time').click(function(){
		$('#stype_dropdown_label').text("수업교시");
		$('#search_query_text').attr('placeholder', "예) 월2, 화6, 금");
		search_type = "class_time";
		$('#search_query_text').focus().val("");
	});
	//개설학과
	$('#stype_department').click(function(){
		$('#stype_dropdown_label').text("개설학과");
		$('#search_query_text').attr('placeholder', "예) 국통");
		search_type = "department";
		$('#search_query_text').focus().val("");
	});
}

function get_filter()
{
	if ($('#search_filter_toggle_button').attr('state') == 'off') return null;
	var result = {};
	//학년
	var academic_year = [];
	$('#filter_academic_year .label-info').each(function(i){
		academic_year.push($(this).attr('value'));
	});
	if (academic_year.length > 0)
		result.academic_year = academic_year;

	//학점
	var credit = [];
	$('#filter_credit .label-info').each(function(i){
		credit.push($(this).attr('value'));
	});
	if (credit.length > 0)
		result.credit = credit;

	//실용외국어
	var practical_foreign_language = [];
	$('#filter_practical_foreign_language .label-info').each(function(i){
		practical_foreign_language.push($(this).attr('value'));
	});
	if (practical_foreign_language.length > 0)
		result.practical_foreign_language = practical_foreign_language;

	//교양과목
	var liberal_arts = [];
	$('#filter_liberal_arts .label-info').each(function(i){
		liberal_arts.push($(this).attr('value'));
	});
	if (liberal_arts.length > 0)
		result.liberal_arts = liberal_arts;

	//기타
	var etc = [];
	$('#filter_etc .label-info').each(function(i){
		etc.push($(this).attr('value'));
	});
	if (etc.length > 0)
		result.etc = etc;

	return result;
}

function refresh_course_detail(selected_lecture)
{
	$('#course_detail_wrapper #course_detail_title').text(s(selected_lecture.course_title));
	$('#course_detail_wrapper .campus').text(s(selected_lecture.campus));
	$('#course_detail_wrapper .course-number').text(s(selected_lecture.course_number));
	$('#course_detail_wrapper .classification').text(s(selected_lecture.classification));
	$('#course_detail_wrapper .department').text(s(selected_lecture.department));
	$('#course_detail_wrapper .academic-year').text(s(selected_lecture.academic_year));
	$('#course_detail_wrapper .credit').text(s(selected_lecture.credit));
	$('#course_detail_wrapper .class-time').text(s(selected_lecture.class_time));
	$('#course_detail_wrapper .instructor').text(s(selected_lecture.instructor));
	$('#course_detail_wrapper .location').text(s(selected_lecture.location));
	$('#course_detail_wrapper .quota').text(s(selected_lecture.quota));
	$('#course_detail_wrapper .enrollment').text(s(selected_lecture.enrollment));
	$('#course_detail_wrapper .remark').text(s(selected_lecture.remark));
	$('#course_detail_rating').children().remove();
	$('#course_detail_plan_button').attr('course-number', selected_lecture.course_number).attr('sector-char', selected_lecture.sector_char);
	$('#course_detail_wrapper').fadeIn();
}

function refresh_my_courses_table()
{
	$('#my_courses_table tbody').children().remove();
	var credit = 0;
	for (var i=0;i<my_lectures.length;i++){
		var lecture = my_lectures[i];
		credit += parseInt(lecture.credit);
		var row = $('<tr></tr>').attr('course-number', lecture.course_number);
		$('<td></td>').addClass('sector').appendTo(row).text(lecture.sector);
		$('<td></td>').addClass('course-number').appendTo(row).text(lecture.course_number);
		var course_title = $('<td></td>').addClass('course-title').appendTo(row).text(lecture.course_title+" ");
		$('<td></td>').addClass('department').appendTo(row).text(lecture.department);
		$('<td></td>').addClass('classification').appendTo(row).text(lecture.classification);
		$('<td></td>').addClass('academic-year').appendTo(row).text(lecture.academic_year);
		$('<td></td>').addClass('credit').appendTo(row).text(lecture.credit);
		$('<td></td>').addClass('class-time').appendTo(row).text(simplify_class_time(lecture.class_time));
		$('<td></td>').addClass('location').appendTo(row).html(simplify_location(lecture.location));
		$('<td></td>').addClass('instructor').appendTo(row).text(lecture.instructor);
		$('<td></td>').addClass('quota').appendTo(row).text(lecture.quota);
		$('<td></td>').addClass('enrollment').appendTo(row).text(lecture.enrollment);
		$('<td></td>').addClass('features').appendTo(row).text(s(lecture.essential_major) + " " + s(lecture.team_teaching) + " " + s(lecture.cyber) + " " + s(lecture['native']));
		$('<td></td>').addClass('remark').appendTo(row).text(lecture.remark);

		row.appendTo($('#my_courses_table tbody'));
		//bind row click event
		row.click(my_courses_row_click_handler);
		//bind row dblclick event
		row.dblclick(function(){
			my_courses_row_dblclick_handler($(this));
		});
		row.addSwipeEvents().bind('doubletap', function(evt, touch) {
			my_courses_row_dblclick_handler($(this));
		})

	}

	if (my_lectures.length == 0){
		var row = $('<tr></tr>').appendTo($('#my_courses_table tbody'));
		$('<td colspan="18">선택된 강의가 없습니다.</td>').appendTo(row).css('text-align', 'center');
	}
	//총 학점 갱신
	$('#my_courses_credit').text(credit+"학점");
	my_courses_selected_row = null;
}

function set_result_table(data)
{
	if (data.page == 1){
		$('#search_result_table tbody').children().remove();
		$('#lectures_content').scrollTop(0);
		if (selected_row) selected_row.removeClass('selected');
		selected_row = null;
		lectures = [];
	}
	lectures = lectures.concat(data.lectures);
	for (var i=0;i<data.lectures.length;i++){
		var lecture = data.lectures[i];
		var row = $('<tr></tr>').attr('course-number', lecture.course_number);
		$('<td></td>').addClass('sector').appendTo(row).text(lecture.sector);
		$('<td></td>').addClass('course-number').appendTo(row).text(lecture.course_number);
		var course_title = $('<td></td>').addClass('course-title').appendTo(row).text(lecture.course_title+" ");
		$('<td></td>').addClass('department').appendTo(row).text(lecture.department);
		$('<td></td>').addClass('classification').appendTo(row).text(lecture.classification);
		$('<td></td>').addClass('academic-year').appendTo(row).text(lecture.academic_year);
		$('<td></td>').addClass('credit').appendTo(row).text(lecture.credit);
		$('<td></td>').addClass('class-time').appendTo(row).text(simplify_class_time(lecture.class_time));
		$('<td></td>').addClass('location').appendTo(row).html(simplify_location(lecture.location));
		$('<td></td>').addClass('instructor').appendTo(row).text(lecture.instructor);
		$('<td></td>').addClass('quota').appendTo(row).text(lecture.quota);
		$('<td></td>').addClass('enrollment').appendTo(row).text(lecture.enrollment);
		var features = [];
		if (lecture.essential_major) features.push(lecture.essential_major);
		if (lecture.team_teaching) features.push(lecture.team_teaching);
		if (lecture.cyber) features.push(lecture.cyber);
		if (lecture['native']) features.push(lecture['native']);
		$('<td></td>').addClass('features').appendTo(row).text(features.join(', '));
		$('<td></td>').addClass('remark').appendTo(row).text(lecture.remark);

		row.appendTo($('#search_result_table tbody'));
		//bind row click event
		row.click(row_click_handler);
		//bind row dblclick event
		row.dblclick(function(){
			row_dblclick_handler($(this));
		});
		row.addSwipeEvents().bind('doubletap', function(evt, touch) {
			row_dblclick_handler($(this));
		})
	}
	if (data.lectures.length == 0){
		var row = $('<tr></tr>').appendTo($('#search_result_table tbody'));
		$('<td colspan="18">'+data.query.query_text+' : 검색 결과가 없습니다.</td>').appendTo(row).css('text-align', 'center');
	}
}

function show_course_detail(options)
{
	function semester_map(semester){
		if (semester == '1')
			return '1';
		if (semester == 'S')
			return '2';
		if (semester == '2')
			return '3';
		if (semester == 'W')
			return '4';
	}
	var year = options.year;
	var semester = options.semester;
	var course_number = options.course_number;
	var sector_char = options.sector_char;
	var url = "http://webs.hufs.ac.kr:8989/src08/jsp/lecture/syllabus.jsp?ledg_year="+year+"&ledg_sessn="+semester_map(semester)+"&org_sect="+sector_char+"&lssn_cd="+course_number;
	window.open(url);
}

