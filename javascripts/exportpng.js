//export timetable to png
var canvas;
var ctx;
var line_vertical = [];
var line_horizontal = [];
var line_width = 3; //weight of line
var export_image_url;
var bg_image;

$(function(){
	$('#nav_export').click(function(){
		$('#content_wrapper').hide();
		$('#export_wrapper').show();
		export_timetable();
	});
	$('#main_navigation a').not('#nav_export').click(function(){
		$('#content_wrapper').show();
		$('#export_wrapper').hide();
	});
	$('#export_wrapper').hide();
	$('#export_save_button').click(function(){
		//Canvas2Image.saveAsPNG(canvas); 
		//return false;
	});
	bg_image = new Image();
	bg_image.src = '/images/tt_background.png';
});

function export_timetable()
{
	canvas = document.getElementById("tt_canvas");  
	ctx = canvas.getContext('2d');

	canvas.width = bg_image.width;
	canvas.height = bg_image.height;
	ctx.drawImage(bg_image, 0, 0, bg_image.width, bg_image.height);
	imgd = ctx.getImageData(0, 0, bg_image.width, bg_image.height); 
	pix = imgd.data;
	//init line variables;
	line_vertical = [];
	line_horizontal = [];
	for (var i=0;i<bg_image.width*4;i+=4){
		if (pix[bg_image.width*4 + i] != 255)
			line_horizontal.push(i/4);
	}
	for (var i=0;i<bg_image.height;i++){
		if (pix[(bg_image.width-2 + bg_image.width*i)*4] != 255)
			line_vertical.push(i);
	}

	draw_timetable();
	$('.timetable-image').remove();
	var imgPNG = Canvas2Image.saveAsPNG(canvas, true); 
	$(imgPNG).appendTo($('#export_image_wrapper')).addClass('timetable-image');

	export_image_url = canvas.toDataURL();
	$('#export_save_button').attr('href', export_image_url);
}

function set_rect_style(color)
{
	ctx.strokeStyle = color.border;
	ctx.fillStyle = color.plane;
	ctx.lineWidth = line_width;
}

//is determined by wday
//return start x, length
function get_x(class_time)
{
	var wday = class_time[0];
	var wdays = "일월화수목금토";
	return {x:line_horizontal[wdays.indexOf(wday)]+(line_width/2)+1, length:line_horizontal[wdays.indexOf(wday)+1]-line_horizontal[wdays.indexOf(wday)]-line_width};
}

//is determined by time
//return start y, length
function get_y(class_time)
{
	var start_time = parseInt(parseFloat(class_time.replace(/[()]/g,"").split('-')[0].slice(1)) * 2);
	var duration = parseInt(parseFloat(class_time.replace(/[()]/g,"").split('-')[1]) * 2);
	var end_time = start_time + duration;
	return {y:line_vertical[start_time+1]+(line_width/2)+1, length:line_vertical[end_time+1]-line_vertical[start_time+1]-line_width};
}

function draw_lecture(lecture)
{
	var class_times = lecture.class_time.split('/');
	var locations = lecture.location.split('/');
	for (var i=0;i<class_times.length;i++){
		var class_time = class_times[i];
		var x = get_x(class_time);
		var y = get_y(class_time);
		set_rect_style(lecture.color);
		ctx.fillRect(x.x,y.y,x.length,y.length);
		ctx.strokeRect(x.x,y.y,x.length,y.length);  

		//text
		var line_height = 14;
		ctx.textAlign = "center";
		ctx.font = "9pt Gulim"
		ctx.fillStyle = "#000";
		var location_y = wrapText(ctx, lecture.course_title, x.x+2 + x.length/2, y.y+line_height, x.length, line_height);
		wrapText(ctx, locations[i], x.x+2 + x.length/2, location_y+line_height, x.length, line_height);
	}
}

function draw_timetable()
{
	//draw timetable from my lectures
	for (var i=0;i<my_lectures.length;i++){
		draw_lecture(my_lectures[i]);
	}
}

function wrapText(context, text, x, y, maxWidth, lineHeight)
{
	var words = text.split(" ");
	var line = "";
	for (var n = 0; n < words.length; n++) 
	{
		var testLine = line + words[n] + " ";
		var metrics = context.measureText(testLine);
		var testWidth = metrics.width;
		if (testWidth > maxWidth) {
			context.fillText(line, x, y);
			line = words[n] + " ";
			y += lineHeight;
		}
		else {
			line = testLine;
		}
	}
	context.fillText(line, x, y);
	return y;
}
