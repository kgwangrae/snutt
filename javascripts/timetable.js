var socket;
function simplify_class_time(class_time)
{
	//월(1.5-1.5) -> 월
	return class_time.replace(/-[\d.,]*\)/g, ")").replace(/,[\d.,]*\)/g, ")").replace(/[()]/g, "");
}

function simplify_location(location)
{
	var arr = location.split('/');
	for (var i=0;i<arr.length-1;i++){
		for (var j=i+1;j<arr.length;j++){
			if (arr[i] == arr[j]){
				arr.splice(j,1);
				j=i;
			}
		}
	}
	return arr.join('<br />');
}

function already_owned_lecture(lecture)
{
	for (var i=0;i<my_lectures.length;i++)
		if (is_equal_lecture(my_lectures[i], lecture)) return true;
	return false;
}

function is_equal_lecture(a, b)
{
	if (a.course_number == b.course_number &&
			a.lecture_number == b.lecture_number)
		return true;
	return false;
}

function already_exist_class_time(lecture)
{
	for (var i=0;i<my_lectures.length;i++){
		if (is_duplicated_class_time(lecture, my_lectures[i])) return true;
	}
	return false;
}

//두 강의의 시간이 겹치는지 체크
function is_duplicated_class_time(l1, l2)
{
	function increasing_sequence(a,b,c){
		if (a < b && b < c) return true;
		return false;
	}
	var t1 = l1.class_time.split("/");
	var t2 = l2.class_time.split("/");
	for (var i=0;i<t1.length;i++){
		for (var j=0;j<t2.length;j++){
			//월(3-3), 월(4-2)
			var wday1 = t1[i][0];
			var wday2 = t2[j][0];
			var time1 = t1[i].replace(/[()]/g, "").slice(1).split('-');
			var time2 = t2[j].replace(/[()]/g, "").slice(1).split('-');
			var start_time1 = parseFloat(time1[0]);
			var start_time2 = parseFloat(time2[0]);
			var duration1 = parseFloat(time1[1]);
			var duration2 = parseFloat(time2[1]);
			if (wday1 == wday2 && 
				 (increasing_sequence(start_time1, start_time2, start_time1+duration1) ||
				  increasing_sequence(start_time1, start_time2+duration2, start_time1+duration1) ||
				  increasing_sequence(start_time2, start_time1, start_time2+duration2) ||
				  increasing_sequence(start_time2, start_time1+duration1, start_time2+duration2) ||
					(start_time1 == start_time2 && duration1 == duration2)
				))
				return true;

		}
	}
	return false;
}

//GLOBAL VARIABLES
var lectures = [];
var my_lectures = [];
var query_text;
var filter;
var per_page = 30;
var page = 1;
var page_loading_complete = true;
var page_loading_requesting = false;
var selected_row;
var my_courses_selected_row;
var search_result_scroll_top = 0;
var current_tab = "search";
var gray_color = {border:"#ccc",plane:"#ddd"};
var colors = [
	{border:"#faa",plane:"#fcc"},
	{border:"#9f9",plane:"#cfc"},
	{border:"#aaf",plane:"#ccf"},
	{border:"#dd9",plane:"#ffa"},
	{border:"#d9d",plane:"#faf"},
	{border:"#9dd",plane:"#cff"}
];
var search_type = "course_title";

$(function(){
	socket = io.connect();
	socket.on('init_client', function(data){
	});
	socket.on('search_result', function(data){
		page_loading_requesting = false;
		if (data.lectures.length == 0 && data.page > 1)
			page_loading_complete = true;
		else {
			set_result_table(data);
			$('#nav_search_result').tab('show');
		}
	});
	socket.on('facebook_publish_complete', function(data){
		$('#publish_facebook_ok_button').removeAttr('disabled');
		$('#facebook_loading_modal').dialog('close');
		if (data.data.error){
			alert('업로드에 실패했습니다.');
		}
		else {
			alert('성공적으로 게시되었습니다!');
			$('#facebook_message').val("");
			$('#facebook_message_wrapper').slideUp();
			$('#publish_facebook_toggle_button').attr('state', 'off').removeClass('dropup');
		}
	});

	$('#brand_button').click(function(){
		$('#nav_search_result').trigger('click');
		return false;
	});

	//resize
	$(window).resize(function(){
		if (selected_row) selected_row.trigger('click');
		else generate_timecell(my_lectures);
	});

	//tab transition
	$('a[data-toggle="tab"]').on('show', function (e) {
		switch ($(e.target).attr('href')){
		case "#my_courses": 
			current_tab = "my_courses";
			break;
		case "#search":
			current_tab = "search";
			break;
		}
	})
	$('a[data-toggle="tab"]').on('shown', function (e) {
		switch ($(e.target).attr('href')){
		case "#my_courses": 
			generate_timecell(my_lectures);
			break;
		case "#search":
			$('#lectures_content').scrollTop(search_result_scroll_top);
			break;
		}
	})

	//set tooltip
	$('#nav_my_courses').tooltip({
		placement : 'bottom',
		trigger : 'manual',
		title : "강의가 추가되었습니다.",
		animation : false
	}).tooltip('show');
	$('.tooltip').addClass('my-course-tooltip').hide();

	//set tooltip
	$('#search_filter_toggle_button').tooltip({
		placement : 'right',
		trigger : 'manual',
		title : "강의가 추가되었습니다.",
		animation : false
	}).tooltip('show');
	$('.tooltip:last').addClass('search-filter-tooltip').hide();

	//scroll change
	$('#lectures_content').scroll(function(){
		if (current_tab == "search"){
			var ele = $(this);
			var scrollHeight = ele.get(0).scrollHeight;
			var scrollTop = ele.scrollTop();
			var scrollBottom = ele.scrollTop() + ele.height();
			var difference = scrollHeight - scrollBottom;
			//현재 scroll 위치 갱신
			search_result_scroll_top = scrollTop;
			//스크롤이 충분히 밑으로 내려가면 다음 페이지 로딩
			if (difference < 200 && !page_loading_requesting && !page_loading_complete){
				page++;
				socket.emit('search_query', {
					filter:filter,
					type:search_type,
					query_text:query_text,
					page:page,
					per_page:per_page
				});
				page_loading_requesting = true;
			}
		}
	});
		
	//search query
	$('#search_form').submit(function(){
		query_text = $('#search_query_text').val();
		page = 1;
		page_loading_complete = false;
		filter = get_filter();
		socket.emit('search_query', {
			filter:filter,
			type:search_type,
			query_text:query_text,
			page:page,
			per_page:per_page
		});
		cancel_lecture_selection();
		return false;
	});

	//표의 빈공간 클릭 시 gray-cell 삭제
	$('#timetable tbody td').click(function(){
		$('.gray-cell').remove();
	});

	//검색필터 on/off 토글
	$('#search_filter_toggle_button').click(function(){
		var ele = $(this);
		if (ele.attr('state') == 'off'){
			ele.attr('state', 'on').addClass('btn-info').addClass('dropup');
			search_filter_tooltip_message('검색필터가 켜졌습니다.');
			$('#search_filter').slideDown();
		}
		else {
			ele.attr('state', 'off').removeClass('btn-info').removeClass('dropup');
			search_filter_tooltip_message('검색필터가 꺼졌습니다.');
			$('#search_filter').slideUp();
		}
	});
	$('#search_filter').hide();
	//검색필터 라벨 클릭
	$('#search_filter .label').click(function(){
		var ele = $(this);
		if (!ele.hasClass('label-info')) ele.addClass('label-info');
		else ele.removeClass('label-info');
	});
	//검색필터 라벨 더블클릭
	$('#search_filter .label').dblclick(function(){
		var ele = $(this);
		ele.parent().children().removeClass('label-info');
		ele.addClass('label-info');
	}).addSwipeEvents().bind('doubletap', function(evt, touch) {
		var ele = $(this);
		ele.parent().children().removeClass('label-info');
		ele.addClass('label-info');
	})
;
	$('#search_filter .header').click(function(){
		var header = $(this);
		var selected = header.siblings('.label-info');
		var all = header.siblings('.label');
		//전부 선택되어있으면 전체선택 해제
		if (all.size() == selected.size()){
			all.removeClass('label-info');
		}else {
			all.addClass('label-info');
		}
	});


	function pagedown_element(ele){
		for (var i=0;i<7 && ele.next().length > 0;i++)
			ele = ele.next();
		return ele;
	}

	function pageup_element(ele){
		for (var i=0;i<7 && ele.prev().length > 0;i++)
			ele = ele.prev();
		return ele;
	}

	$('body').keydown(function(e){
		if (e.keyCode == 9){
			//tab
			$('#search_query_text').focus();
			return false;
		}
		else if (e.keyCode == 34 && current_tab == "search"){
			//pagedown
			//선택된 것이 없으면 1번째 row 선택
			if (!selected_row && lectures.length > 0){
				$('#search_result_table tbody tr').first().trigger('click');
				$('#search_query_text').blur();
			}
			else if (selected_row && pagedown_element(selected_row).length > 0){
				pagedown_element(selected_row).trigger('click');
				var new_position = selected_row.position().top - selected_row.parent().position().top + 26 - 110;
				$('#lectures_content').scrollTop(new_position);
				$('#search_query_text').blur();
			}
			return false;
		}
		else if (e.keyCode == 33 && current_tab == "search"){
			//pageup
			if (!selected_row && lectures.length > 0){
				$('#search_result_table tbody tr').first().trigger('click');
				selected_row.addClass('selected');
				$('#search_query_text').blur();
			}
			else if (selected_row && pageup_element(selected_row).length > 0){
				pageup_element(selected_row).trigger('click');
				var new_position = selected_row.position().top - selected_row.parent().position().top + 26 - 110;
				$('#lectures_content').scrollTop(new_position);
				$('#search_query_text').blur();
			}
			return false;
		}
		else if (e.keyCode == 40 && current_tab == "search"){
			//down
			//선택된 것이 없으면 1번째 row 선택
			if (!selected_row && lectures.length > 0){
				$('#search_result_table tbody tr').first().trigger('click');
				$('#search_query_text').blur();
			}
			else if (selected_row && selected_row.next().length > 0){
				selected_row.next().trigger('click');
				set_scroll_to_selected_row();
				$('#search_query_text').blur();
			}
			return false;
		}
		else if (e.keyCode == 38 && current_tab == "search"){
			//up
			if (!selected_row && lectures.length > 0){
				$('#search_result_table tbody tr').first().trigger('click');
				selected_row.addClass('selected');
				$('#search_query_text').blur();
			}
			else if (selected_row && selected_row.prev().length > 0){
				selected_row.prev().trigger('click');
				set_scroll_to_selected_row();
				$('#search_query_text').blur();
			}
			return false;
		}
		//내 강의
		else if (e.keyCode == 40 && current_tab == "my_courses"){
			//down
			//선택된 것이 없으면 1번째 row 선택
			if (!my_courses_selected_row && my_lectures.length > 0){
				$('#my_courses_table tbody tr').first().trigger('click');
				$('#search_query_text').blur();
			}
			else if (my_courses_selected_row && my_courses_selected_row.next().length > 0){
				my_courses_selected_row.next().trigger('click');
				set_scroll_to_my_courses_selected_row();
				$('#search_query_text').blur();
			}
			return false;
		}
		else if (e.keyCode == 38 && current_tab == "my_courses"){
			//up
			if (!my_courses_selected_row && my_lectures.length > 0){
				$('#my_courses_table tbody tr').first().trigger('click');
				$('#search_query_text').blur();
			}
			else if (my_courses_selected_row && my_courses_selected_row.prev().length > 0){
				my_courses_selected_row.prev().trigger('click');
				set_scroll_to_my_courses_selected_row();
				$('#search_query_text').blur();
			}
			return false;
		}
		else if (e.keyCode == 13 && current_tab == "search"){
			//enter
			if (selected_row && $('#search_query_text:focus').size() == 0){
				selected_row.trigger('dblclick');
			}
		}
		else if (e.keyCode == 13 && current_tab == "my_courses"){
			//enter
			if (my_courses_selected_row && $('#search_query_text:focus').size() == 0){
				my_courses_selected_row.trigger('dblclick');
			}
		}
		else {
			//$('#search_query_text').focus();
		}
	});	

	//search type 설정
	//교과목명
	$('#stype_course_title').click(function(){
		$('#stype_dropdown_label').text("교과목명");
		$('#search_query_text').attr('placeholder', "예) 수및연");
		search_type = "course_title";
		$('#search_query_text').focus().val("");
	});
	//교수명
	$('#stype_instructor').click(function(){
		$('#stype_dropdown_label').text("교수명");
		$('#search_query_text').attr('placeholder', "예) 홍진호");
		search_type = "instructor";
		$('#search_query_text').focus().val("");
	});
	//교과목번호
	$('#stype_course_number').click(function(){
		$('#stype_dropdown_label').text("교과목번호");
		$('#search_query_text').attr('placeholder', "예) 002.005A 001");
		search_type = "course_number";
		$('#search_query_text').focus().val("");
	});
	//수업교시
	$('#stype_class_time').click(function(){
		$('#stype_dropdown_label').text("수업교시");
		$('#search_query_text').attr('placeholder', "예) 월1,5, 월6, 금");
		search_type = "class_time";
		$('#search_query_text').focus().val("");
	});
	//수업교시
	$('#stype_department').click(function(){
		$('#stype_dropdown_label').text("개설학과");
		$('#search_query_text').attr('placeholder', "예) 컴공");
		search_type = "department";
		$('#search_query_text').focus().val("");
	});

	//facebook modal
	$('#facebook_loading_modal').dialog({
		modal:true,
		resizable:false,
		closeOnEscape:false,
		autoOpen:false
	});

	//페이스북에 공유하기
	$('#publish_facebook_toggle_button').click(function(){
		var ele = $(this);
		if (ele.attr('state') == 'off'){
			ele.attr('state', 'on').addClass('dropup');
			$('#facebook_message_wrapper').slideDown();
			$('#facebook_message').focus();
		}
		else {
			ele.attr('state', 'off').removeClass('dropup');
			$('#facebook_message').blur();
			$('#facebook_message_wrapper').slideUp();
		}
		return false;
	});
	$('#facebook_message_wrapper').hide();

	//페이스북에 올리기
	$('#facebook_message_wrapper').submit(function(){
		var ele = $('#publish_facebook_ok_button');
		if (!ele.attr('disabled')){
			ele.attr('disabled', true);

			FB.login(function(response){
				if (response.authResponse){
					var access_token = response.authResponse.accessToken;
					var base64_data = $('.timetable-image').attr('src').replace(/data:image\/png;base64,/, "");
					var message = $("#facebook_message").val();
					socket.emit('publish_timetable_to_facebook', {
						access_token:access_token,
						base64_data:base64_data,
						message:message
					});
					$('#facebook_message').blur();
					$('#facebook_loading_modal').dialog('open');
				}
				else {
					alert("페이스북 로그인에 실패했습니다.");
					ele.removeAttr('disabled');
				}
			}, {scope:'publish_stream'});
		}
		return false;
	});

});

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

	//학문의 기초
	var basics = [];
	$('#filter_basics .label-info').each(function(i){
		basics.push($(this).attr('value'));
	});
	if (basics.length > 0)
		result.basics = basics;

	//핵심 교양
	var core = [];
	$('#filter_core .label-info').each(function(i){
		core.push($(this).attr('value'));
	});
	if (core.length > 0)
		result.core = core;

	//기타
	var etc = [];
	$('#filter_etc .label-info').each(function(i){
		etc.push($(this).attr('value'));
	});
	if (etc.length > 0)
		result.etc = etc;

	return result;
}

function set_scroll_to_selected_row()
{
	if (selected_row){
		var new_position = selected_row.position().top - selected_row.parent().position().top + 26 - 110;
		$('#lectures_content').scrollTop(new_position);
	}
}

function set_scroll_to_my_courses_selected_row()
{
	if (my_courses_selected_row){
		var new_position = my_courses_selected_row.position().top - my_courses_selected_row.parent().position().top + 26 - 110;
		$('#lectures_content').scrollTop(new_position);
	}
}


function get_lecture_by_course_number(course_number, lecture_number)
{
	course_number = course_number || "";
	lecture_number = lecture_number || "";
	for (var i=0;i<lectures.length;i++){
		if(lectures[i].course_number == course_number && lectures[i].lecture_number == lecture_number)
			return lectures[i];
	}
	return null;
}

function get_my_lecture_by_course_number(course_number, lecture_number)
{
	course_number = course_number || "";
	lecture_number = lecture_number || "";
	for (var i=0;i<my_lectures.length;i++){
		if(my_lectures[i].course_number == course_number && my_lectures[i].lecture_number == lecture_number)
			return my_lectures[i];
	}
	return null;
}

function wday_to_num(wday){
	if (wday == "월") return 0;
	if (wday == "화") return 1;
	if (wday == "수") return 2;
	if (wday == "목") return 3;
	if (wday == "금") return 4;
	if (wday == "토") return 5;
	return -1;
}

function generate_random_color(color)
{
	if (!color)	return colors[Math.floor(colors.length * Math.random())];
	var result = colors[Math.floor(colors.length * Math.random())];
	while (result.plane == color.plane){
		result = colors[Math.floor(colors.length * Math.random())];
	}
	return result;
}

function generate_timecell(lectures)
{
	$('.timecell-container').remove();
	var unitcell_width = $('#timetable tbody td').width()+2;
	var unitcell_height = $('#timetable tbody td').height()+2;
	var leftcell_width = $('#timetable tbody th').width()+2;
	var topcell_height = $('#timetable thead th').height()+2;
	var border_weight = 3;

	for (var a=0;a<lectures.length;a++){
		var lecture = lectures[a];
		//시간이 유효하지 않으면 스킵
		if (wday_to_num(lecture.class_time[0]) == -1) continue;
		//cell 색깔 설정
		if (!lecture.color) generate_random_color(lecture.color);

		var class_times = lecture.class_time.split("/");
		var locations = lecture.location.split("/");
		for (var i=0;i<class_times.length;i++){
			//setup variables
			var wday = wday_to_num(class_times[i][0]);
			var start_time = parseFloat(class_times[i].replace(/[()]/g,"").split('-')[0].slice(1))*2;
			var duration = parseFloat(class_times[i].replace(/[()]/g,"").split('-')[1])*2;
			//기준 셀
			var criteria_cell = $($('#timetable td')[6*start_time+wday]);
			var criteria_cell2;
			if (wday == 5) criteria_cell2 = criteria_cell.prev();
			else criteria_cell2 = criteria_cell.next();

			//var width = unitcell_width - border_weight*2;
			//var left = leftcell_width + (width+2*border_weight)*wday;
			//var top = topcell_height + (unitcell_height)*start_time;
			
			var width = Math.abs(criteria_cell2.position().left - criteria_cell.position().left) - 2*border_weight;
			var height = (unitcell_height)*duration - border_weight*2;
			var left = criteria_cell.position().left - criteria_cell.parent().position().left;
			var top = criteria_cell.position().top - criteria_cell.parent().parent().position().top + topcell_height;

			//create container
			var container = $('<div></div>').addClass('timecell-container').appendTo($('#timecells_container'));
			var div = $('<div></div>').addClass('timecell').width(width).height(height).css('left', left).css('top', top).css('background-color', lecture.color.plane).css('border-color', lecture.color.border).appendTo(container);
			$('<span></span>').text(lecture.course_title).appendTo(div);
			$('<br />').appendTo(div);
			$('<span></span>').text(locations[i]).appendTo(div);
			//gray cell이면 gray-cell 클래스 추가
			if (lecture.color == gray_color)
				div.addClass('gray-cell');

			div.attr('course-number', lecture.course_number).attr('lecture-number', lecture.lecture_number);
		}
	}
	//graycell click event 추가
	$('.gray-cell').click(function(){
		if (selected_row)
			row_dblclick_handler(selected_row);
		return false;
	});

	//timecell click event bind : 색깔 바꾸기
	$('.timecell').click(function(){
		var ele = $(this);
		var lecture = get_my_lecture_by_course_number(ele.attr('course-number'), ele.attr('lecture-number'));
		if (lecture && !ele.hasClass('gray-cell')){ //회색이 아닐때만 바꿈
			lecture.color = generate_random_color(lecture.color);
			$('.timecell').each(function(x){
				var cell = $(this);
				if (cell.attr('course-number') == ele.attr('course-number') && cell.attr('lecture-number') == ele.attr('lecture-number'))
					cell.css('background-color', lecture.color.plane).css('border-color', lecture.color.border);
			});
		}
	});

	//timecell dblclick event bind
	$('.timecell').dblclick(function(){
		timecell_dblclick_handler($(this));
	}).addSwipeEvents().bind('doubletap', function(evt, touch) {
		timecell_dblclick_handler($(this));
	})
}

function my_course_tooltip_message(message)
{
	$('.my-course-tooltip .tooltip-inner').text(message);
	$('.my-course-tooltip').hide().stop(true,true).fadeIn(500, function(){
		$('.my-course-tooltip').stop(true,true).animate({color:"#fff"}, 1000, function(){
			$('.my-course-tooltip').stop(true,true).fadeOut(500);
		});
	});
}

function search_filter_tooltip_message(message)
{
	$('.search-filter-tooltip .tooltip-inner').text(message);
	$('.search-filter-tooltip').hide().stop(true,true).fadeIn(500, function(){
		$('.search-filter-tooltip').stop(true,true).animate({color:"#fff"}, 1000, function(){
			$('.search-filter-tooltip').stop(true,true).fadeOut(500);
		});
	});
}

function remove_lecture_from_my_lectures(lecture)
{
	//선택된 강의를 my_lectures에서 제거한다.
	if (lecture){
		lecture.color = null;
		for (var i=0;i<my_lectures.length;i++){
			if (is_equal_lecture(my_lectures[i], lecture)){
				my_lectures.splice(i,1);
				break;
			}
		}
		refresh_my_courses_table();
		generate_timecell(my_lectures);
		my_course_tooltip_message("강의가 제거되었습니다.");
	}
}

function timecell_dblclick_handler(ele)
{
	var lecture = get_my_lecture_by_course_number(ele.attr('course-number'), ele.attr('lecture-number'));
	//더블클릭하면 삭제
	var con = confirm("["+lecture.course_title+"]를 시간표에서 제거하시겠습니까?");
	if (con){
		remove_lecture_from_my_lectures(lecture);
	}
}

function my_courses_row_click_handler()
{
	if (my_courses_selected_row){
		my_courses_selected_row.removeClass('selected');
		my_courses_selected_row.find('.remove-course-button').hide();
	}
	var ele = $(this);
	ele.addClass('selected');
	my_courses_selected_row = ele;
	my_courses_selected_row.find('.remove-course-button').show();
	//timetable refreshing
	var selected_lecture = get_my_lecture_by_course_number(ele.attr('course-number'), ele.attr('lecture-number'));
	if (!selected_lecture.color)
		selected_lecture.color = gray_color;
	generate_timecell(my_lectures.concat([selected_lecture]));
}

function row_click_handler()
{
	if (selected_row){
		selected_row.removeClass('selected');
		selected_row.find('.add-course-button').hide();
	}
	var ele = $(this);
	ele.addClass('selected');
	selected_row = ele;
	selected_row.find('.add-course-button').show();
	//timetable refreshing
	var selected_lecture = get_lecture_by_course_number(ele.attr('course-number'), ele.attr('lecture-number'));
	if (!selected_lecture.color)
		selected_lecture.color = gray_color;
	generate_timecell(my_lectures.concat([selected_lecture]));
}

function my_courses_row_dblclick_handler(ele)
{
	var selected_lecture = get_my_lecture_by_course_number(ele.attr('course-number'), ele.attr('lecture-number'));
	remove_lecture_from_my_lectures(selected_lecture);
}

function row_dblclick_handler(ele)
{
	var selected_lecture = get_lecture_by_course_number(ele.attr('course-number'), ele.attr('lecture-number'));
	if (selected_lecture){
		//selected_lecture가 이미 들어있지 않으면
		if (already_owned_lecture(selected_lecture)){
			alert("이미 넣은 강의입니다.");
		}
		//강의 시간이 겹치면
		else if (already_exist_class_time(selected_lecture)){
			alert("강의시간이 겹칩니다.");
		}
		else {
			selected_lecture.color = generate_random_color(selected_lecture.color);
			my_lectures.push(selected_lecture);
			generate_timecell(my_lectures);
			refresh_my_courses_table();
			my_course_tooltip_message("강의가 추가되었습니다.");
		}
	}
}

function cancel_lecture_selection()
{
	$('.selected').removeClass('selected');
	selected_row = null;
	generate_timecell(my_lectures);
}

function refresh_my_courses_table()
{
	$('#my_courses_table tbody').children().remove();
	var credit = 0;
	for (var i=0;i<my_lectures.length;i++){
		var lecture = my_lectures[i];
		credit += parseInt(lecture.credit);
		var row = $('<tr></tr>').attr('course-number', lecture.course_number).attr('lecture-number', lecture.lecture_number);
		$('<td></td>').addClass('course-number').appendTo(row).text(lecture.course_number);
		$('<td></td>').addClass('lecture-number').appendTo(row).text(lecture.lecture_number);
		var course_title = $('<td></td>').addClass('course-title').appendTo(row).text(lecture.course_title+" ");
		$('<td></td>').addClass('classification').appendTo(row).text(lecture.classification);
		//$('<td></td>').addClass('department').appendTo(row).text(lecture.department);
		$('<td></td>').addClass('academic-year').appendTo(row).text(lecture.academic_year);
		$('<td></td>').addClass('credit').appendTo(row).text(lecture.credit);
		$('<td></td>').addClass('class-time').appendTo(row).text(simplify_class_time(lecture.class_time));
		$('<td></td>').addClass('location').appendTo(row).html(simplify_location(lecture.location));
		$('<td></td>').addClass('instructor').appendTo(row).text(lecture.instructor);
		$('<td></td>').addClass('quota').appendTo(row).text(lecture.quota);
		$('<td></td>').addClass('enrollment').appendTo(row).text(lecture.enrollment);
		$('<td></td>').addClass('remark').appendTo(row).text(lecture.remark);
		var remove_button = $('<span class="badge badge-important">제거</span>').addClass('remove-course-button').appendTo(course_title).hide();

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

		//remove_button click
		remove_button.click(function(){
			if (my_courses_selected_row) my_courses_selected_row.trigger('dblclick');
		});
	}

	if (my_lectures.length == 0){
		var row = $('<tr></tr>').appendTo($('#my_courses_table tbody'));
		$('<td colspan="12">선택된 강의가 없습니다.</td>').appendTo(row).css('text-align', 'center');
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
		var row = $('<tr></tr>').attr('course-number', lecture.course_number).attr('lecture-number', lecture.lecture_number);
		$('<td></td>').addClass('course-number').appendTo(row).text(lecture.course_number);
		$('<td></td>').addClass('lecture-number').appendTo(row).text(lecture.lecture_number);
		var course_title = $('<td></td>').addClass('course-title').appendTo(row).text(lecture.course_title+" ");
		$('<td></td>').addClass('classification').appendTo(row).text(lecture.classification);
		//$('<td></td>').addClass('department').appendTo(row).text(lecture.department);
		$('<td></td>').addClass('academic-year').appendTo(row).text(lecture.academic_year);
		$('<td></td>').addClass('credit').appendTo(row).text(lecture.credit);
		$('<td></td>').addClass('class-time').appendTo(row).text(simplify_class_time(lecture.class_time));
		$('<td></td>').addClass('location').appendTo(row).html(simplify_location(lecture.location));
		$('<td></td>').addClass('instructor').appendTo(row).text(lecture.instructor);
		$('<td></td>').addClass('quota').appendTo(row).text(lecture.quota);
		$('<td></td>').addClass('enrollment').appendTo(row).text(lecture.enrollment);
		$('<td></td>').addClass('remark').appendTo(row).text(lecture.remark);
		var add_button = $('<span class="badge badge-success">추가</span>').addClass('add-course-button').appendTo(course_title).hide();

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
		//add_button click
		add_button.click(function(){
			if (selected_row) selected_row.trigger('dblclick');
		});
	}
	if (data.lectures.length == 0){
		var row = $('<tr></tr>').appendTo($('#search_result_table tbody'));
		$('<td colspan="12">'+data.query.query_text+' : 검색 결과가 없습니다.</td>').appendTo(row).css('text-align', 'center');
	}
}
