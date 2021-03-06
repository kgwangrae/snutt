//export timetable to png
var canvas;
var ctx;
var line_vertical = [];
var line_horizontal = [];
var line_width = 3; //weight of line
var export_image_url;
var bg_image;
line_vertical = [0, 33, 53, 75, 95, 117, 138, 159, 180, 201, 221, 243, 263, 285, 305, 327, 348, 368, 390, 410, 431, 452, 473, 494, 515, 536, 557, 579, 600, 621];
line_horizontal = [0, 74, 182, 290, 397, 505, 613, 721];

$(function(){
	//png export를 지원하는 웹브라우저만
	if (supportsToDataURL()){
		bg_image = new Image(726,626);
		bg_image.src = '/asset/tt_background2.png';

		bg_image.onload = function(){
			$('#export_image_wrapper').width(bg_image.width);
			$('#export_image_wrapper').height(bg_image.height);
			canvas = document.getElementById("tt_canvas");  
			canvas.width = bg_image.width;
			canvas.height = bg_image.height;
			ctx = canvas.getContext('2d');
			ctx.drawImage(bg_image, 0, 0, bg_image.width, bg_image.height);
			imgd = ctx.getImageData(0, 0, bg_image.width, bg_image.height); 
			pix = imgd.data;
			//init line variables;
			/*
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
			*/
		}
	}
});

function export_timetable()
{
	if (!ctx){
		alert("오류가 발생했습니다. 잠시 뒤 다시 시도해주세요.");
		return;
	}
	ctx.drawImage(bg_image, 0, 0, bg_image.width, bg_image.height);

	draw_timetable();
	$('.timetable-image').remove();
	//var imgPNG = Canvas2Image.saveAsPNG(canvas, true); 
	var imgPNG = new Image();
	imgPNG.src = canvas.toDataURL("image/png");
	$(imgPNG).appendTo($('#export_image_wrapper')).addClass('timetable-image');

	$('#export_save_button').attr('href', imgPNG.src);
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

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  if (typeof stroke == "undefined" ) {
    stroke = true;
  }
  if (typeof radius === "undefined") {
    radius = 5;
  }
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (stroke) {
    ctx.stroke();
  }
  if (fill) {
    ctx.fill();
  }        
}

function draw_lecture(lecture)
{
	var class_times = lecture.class_time.split('/');
	var locations = lecture.location.split('/');
	for (var i=0;i<class_times.length;i++){
		var class_time = class_times[i];
		var x = get_x(class_time);
		var y = get_y(class_time);
                var rect_style = {plane:lecture.color.plane, border:lecture.color.plane};
		set_rect_style(rect_style);
		roundRect(ctx,x.x,y.y,x.length,y.length,5,true,true);
                /*
                ctx.fillRect(x.x,y.y,x.length,y.length);
		ctx.strokeRect(x.x,y.y,x.length,y.length);  
                */
		//text
		var line_height = 14;
		ctx.textAlign = "center";
		ctx.font = "9pt Nanum Gothic";

                console.log(lecture.color);
		ctx.fillStyle = lecture.color.border;
		var location_y = wrapText(ctx, lecture.course_title, x.x+2 + x.length/2, y.y+y.length/2-line_height/4, x.length, line_height);
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

function supports_canvas()
{
	return !!document.createElement('canvas').getContext;
}

function supportsToDataURL()
{
	if(!supports_canvas())
	{
		return false;
	}

	var c = document.createElement("canvas");
	var data = c.toDataURL("image/png");
	return (data.indexOf("data:image/png") == 0);
}

function exportCal(serviceType) {
  console.log(my_lectures);
  params = $.param(
    {'type': serviceType,
    'lectures': my_lectures}
  );
  window.open("/calendar/export?" + params, "_blank");
}
