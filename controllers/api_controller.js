module.exports = {
  init_client: function(params, renderer, request) {
    renderer.json({
      test: 'test',
      coursebook_info: SNUTT.get_coursebook_info(),
      last_coursebook_info: SNUTT.get_last_coursebook_info()
    });
  },
  search_query: function(params, renderer, request) {
    renderer.json(SNUTT.get_lectures(params));
  },
  export_timetable: function(params, renderer, request) {
    var my_lectures = params.my_lectures;
    var content = "var current_year = '" + params.year + "';\n";
    content = content + "var current_semester = '" + params.semester + "';\n";
    content = content + "var my_lectures = [";
    for (var i=0;i<my_lectures.length;i++){
      content = content + objectToString(my_lectures[i]);
      if (i != my_lectures.length - 1)
        content = content + ",";
    }
    content = content + "];\n";
    var filename = SNUTT.increase_userdata_cnt();
    var filepath = ROOT_PATH + '/timetable_userdata/' + filename;
    fs.writeFile(filepath, content, function(err){
      if (err){
        renderer.json({error:err});
      } else {
        renderer.json({filename:filename});
      }
    });
  },
  publish_to_facebook: function(options, renderer, request) {
    //access_token, base64_data, message
    var options = options || {};
    var access_token = options.access_token;
    var base64_data = options.base64_data;
    var message = options.message.toString('utf8');
    message = message + "\nhttp://snutt.kr"

    var filename = ROOT_PATH + '/timetable_images/' + String((new Date()).getTime()) + "_" + Math.floor(Math.random() * 10000) + ".png";
    var base64Image = base64_data.toString('base64');
    var decodedImage = new Buffer(base64Image, 'base64');
    fs.writeFile(filename, decodedImage, function(err){
      if (err){
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
