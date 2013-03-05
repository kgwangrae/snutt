class Lecture
  constructor: (options) ->
    options = options || {}
    @classification = options["classification"]
    @department = options["department"]
    @academic_year = options["academic_year"]
    @course_number = options["course_number"]
    @lecture_number = options["lecture_number"]
    @course_title = options["course_title"] || ""
    @credit = options["credit"]
    @class_time = options["class_time"]
    @location = options["location"]
    @instructor = options["instructor"]
    @quota = options["quota"]
    @enrollment = options["enrollment"]
    @remark = options["remark"]
    @category = options["category"] || ""
    @snuev_lec_id = options["snuev_lec_id"] || ""
    @snuev_eval_score = parseFloat(options["snuev_eval_score"])

class SNUtt
  constructor: ->
    @app = require('http').createServer(@handler)
    @url = require('url')
    @path = require('path')
    @io = require('socket.io').listen(@app)
    @fs = require('fs')
    @mime = require('mime')
    @restler = require('restler')
    @querystring = require('querystring')
    @utils = require('./utils.js')
    @coursebook = {}
    @last_coursebook_info = {
      year: 2000
      semester: 1
      updated_time: "2000-01-01 00:00:00"
    }

    @io.set('log level', 1)
    @io.sockets.on 'connection', (socket) =>
      socket.emit 'init_client', {
        mesage: "Hello World!"
        coursebook_info: @get_coursebook_info()
        last_coursebook_info: @last_coursebook_info
      }

      socket.on 'search_query', (data) =>
        socket.emit 'search_result', @get_lectures(data)

      socket.on 'publish_timetable_to_facebook', (data) =>
        password = @s(data.password)
        if password is "snutt!@"
          console.log "coursebook is updated"
          init_data()

      socket.on 'export_timetable', (data) =>
        my_lectures = data.my_lectures
        content = "
          var current_year = '#{data.year}';
          var current_semester = '#{data.semester}';
          var my_lectures = ["

        for my_lecture, i in my_lectures
          content += utils.objectToString(my_lecture)
          content += "," if i isnt my_lectures.length - 1

        content+= "];\n"
        userdata_cnt++

        filename = userdata_cnt
        filepath = __dirname + '/timetable_userdata' + filename

        @fs.writeFile filepath, content, (err) ->
          if err
            console.log "EXPORT ERROR: " + err
            socket.emit 'export_timetable_result', {error: err}
            return
          
          socket.emit "export_timetable_result", {filename: filename}

    @userdata_cnt = @max(@fs.readdirSync(__dirname + "/timetable_userdata"))
    @timetable_header = @fs.readFileSync "#{__dirname}/timetable_header.htm"
    @timetable_footer = @fs.readFileSync "#{__dirname}/timetable_footer.htm"

    @load_data(2012, '1')
    @load_data(2012, 'S')
    @load_data(2012, '2')
    @load_data(2012, 'W')
    @load_data(2013, '1')
    @stats = @fs.stat 'timetable_images', (err, stats) =>
      @fs.mkdir('timetable_images') if err
    @stats = @fs.stat 'timetable_userdata', (err, stats) =>
      @fs.mkdir('timetable_userdata') if err

    @port = process.env.PORT || 3784
    @app.listen @port
    console.log "Listening on #{@port}"

  max: (arr) -> arr.reduce(((a, b) -> Math.max(parseInt(a), parseInt(b))), 0)
  s: (str) -> str || ""

  get_coursebook_info: ->
    result = []
    result.push {year: value.year, semester: value.semester, updated_time: value.updated_time} for key, value of @coursebook

    semester_to_number = (s) ->
      switch s
        when '1' then 1
        when 'S' then 2
        when '2' then 3
        when 'W' then 4
        else 5

    result.sort (a, b) -> semester_to_number(a.semester) - semester_to_number(b.semester) # sort semester
    result.sort (a, b) -> a.year = b.year # sort year
    result.reverse()
  
  load_data: (year, semester) ->
    hash = year + semester
    datapath = "#{__dirname}/data/txt/#{year}_#{semester}.txt"
    console.log datapath

    @fs.readFile datapath, (err, data) =>
      if err
        console.log "DATA LOAD FAIL : #{year}_#{semester}"
        return

      lines = data.toString().split("\n")
      year = lines[0].split("/")[0]
      semester = lines[0].split("/")[1]
      updated_time = lines[1]
      header = lines[2].split(";")
      lectures = []

      for i in [3..lines.length]
        line = lines[i] || ""
        options = {}
        components = line.split(";")

        options[header[j]] = components[j] for j in [0..components.length]
        options["classification"] = "핵교" unless @s(options["category"]).indexOf('core') is -1
        lectures.push new Lecture(options)

      @coursebook[hash] = {
        lectures: lectures
        year: year
        semester: semester
        updated_time: updated_time
      }

      if @last_coursebook_info.updated_time < updated_time
        @last_coursebook_info.year = year
        @last_coursebook_info.semester = semester
        @last_coursebook_info.updated_time = updated_time

      console.log "LOAD COMPLETE : #{year}_#{semester}"

  handler: (req, res) =>
    uri = @url.parse(req.url).pathname
    query = @querystring.parse(@url.parse(req.url).query)
    filename = @path.join(process.cwd(), uri)
    user_agent = req.headers['user-agent']
    not_support = (/msie 6.0/i.test(user_agent)) || (/msie 7.0/i.test(user_agent))
    
    if uri is "/"
      if not_support
        @fs.readFile "#{__dirname}/not_support.htm", (err, data) ->
          if err
            res.writeHead(200)
            return res.end "ERROR"
            console.log err
            console.log "111111111111"

          res.writeHead 200, {"Content-Type": @mime.lookup "#{__dirname}/not_support.htm"}
          res.end data
			#저장된 시간표 불러오기 (수정모드)

      else if query.user
        @fs.readFile "#{__dirname}/timetable_userdata/#{query.user}", (err, content) ->
          if err
            res.writeHead(200)
            res.end("ERROR")
            console.log err
            console.log "222222222222"
          else
            res.writeHead 200, {'Content-Type': "text/html"}
            res.write(@timetable_header)
            res.write(content)
            res.end(@timetable_footer)
      else
        res.writeHead 200, {'Content-type': "text/html"}
        res.write(@timetable_header)
        res.end(@timetable_footer)

    else if uri.indexOf("/user/") is 0
      console.log "loaddata"
      filename = uri.replace "/user/", ""
      @fs.readFile "#{__dirname}/timetable_userdata/#{filename}", (err, content) =>
        if err
          res.writeHead(200)
          res.end("ERROR")
          console.log err
          console.log "333333333333333"

        else
          header = @fs.readFileSync "#{__dirname}/user_timetable_header.htm"
          footer = @fs.readFileSync "#{__dirname}/user_timetable_footer.htm"

          res.writeHead 200, {'Content-Type': "text/html"}
          res.write(header)
          res.write(content)
          res.end(footer)

    else
      @fs.readFile "#{__dirname}#{uri}", (err, data) =>
        if err
          res.writeHead(200)
          console.log err
          console.log "44444444444444"
          return res.end("ERROR")

        filestat = @fs.statSync(filename)
        filemime = @mime.lookup(filename)

        res.writeHead 200, {
          'Content-Type': filemime
          'Content-Length': filestat.size
        }

        res.end(data)

  filter_check: (lecture, filter) ->
    return true unless filter

    if filter.academic_year
      result = false

      for academic_year in filter.academic_year
        switch academic_year
          when "1" and lecture.academic_year is "1학년" then result = true
          when "2" and lecture.academic_year is "2학년" then result = true
          when "3" and lecture.academic_year is "3학년" then result = true
          when "4" and (lecture.academic_year is "4학년" or lecture.academic_year is "5학년") then result = true
          when "5" and (lecture.academic_year is "석사" or lecture.academic_year is "박사" or lecture.academic_year is "석박사") then result = true

      return false unless result
    
    if filter.credit
      result = false

      for credit in filter.credit
        switch credit
          when "1" and lecture.credit is "1" then result = true
          when "2" and lecture.credit is "2" then result = true
          when "3" and lecture.credit is "3" then result = true
          when "4" and lecture.credit is "4" then result = true
          when "5" and parseInt(lecture.credit) >= 5 then result = true

      return false unless result

    return true if !filter.basics and !filter.core and !filter.etc

    result = false

    if filter.basics
      for basics in filter.basics
        result = true if basics is lecture.category

    if filter.core
      for core in filter.core
        result = true if core is lecture.category

    if filter.etc
      for etc in filter.etc
        switch etc
          when "teaching" and lecture.classification is "교직" then result = true
          when "exercise" and lecture.category is "normal_exercise" then result = true
          when "etc" and lecture.category isnt "normal_exercise" and
            @s(lecture.category).indexOf('normal') isnt -1 then result = true

    return result

  get_lectures: (query) ->
    return { lectures:[], page: 1, per_page: query.per_page, query: query} unless @coursebook[@s(query.year) + @s(query.semester)]

    lectures = @coursebook[@s(query.year) + @s(query.semester)].lectures
    page = query.page || 1
    per_page = query.per_page || 30
    filter = query.filter
    result = {
      lectures: []
      page: page
      per_page: per_page
      query: query}

    if query.type is "course_title"
      title = query.query_text
      skip_count = 0
      for lecture in lectures
        if @increasing_order_inclusion(lecture.course_title, title) and @filter_check(lecture, filter)
          if skip_count < per_page * (page - 1)
            skip_count++
          else
            result.lectures.push(lecture)

        break if result.lectures.length >= per_page
      return result

    else if query.type is "instructor"
      instructor = query.query_text.replace(/\s+/g, "").toLowerCase()
      skip_count = 0

      for lecture in lectures
        lecture_instructor = @s(lecture.instructor).replace(/\s+/g, "").toLowerCase()
        if lecture_instructor.indexOf(instructor) isnt -1 and @filter_check(lecture, filter)
          if skip_count < per_page * (page - 1)
            skip_count++
          else
            result.lectures.push lecture

        break if result.lectures.length >= per_page
      return result

    else if query.type is "course_number"
      course_number = query.query_text.replace(/\s+/g, "").toLowerCase()
      skip_count = 0

      for lecture in lectures
        lecture_course_number = @s(lecture.course_number) + @s(lecture.lectures_number).replace(/\s+/g, "").toLowerCase()
        if lecture_course_number.indexOf(course_number) isnt -1 and @filter_check(lecture, filter)
          if skip_count < per_page * (page - 1)
            skip_count++
          else
            result.lectures.push lecture

        break if result.lectures.length >= per_page
      return result
    
    else if query.type is "class_time"
      class_times = query.query_text.replace(/\s+/g, "").split(',')
      skip_count = 0

      for lecture in lectures
        lecture_class_times = @s(lecture.class_time).split(',')
        if @class_times_check(lecture_class_times, class_times) and @filter_check(lecture, filter)
          if skip_count < per_page * (page - 1)
            skip_count++
          else
            result.lectures.push lecture

        break if result.lectures.length >= per_page
      return result

    else if query.type is "department"
      department = query.query_text
      skip_count = 0

      for lecture in lectures
        if @increasing_order_inclusion(lecture.department, department) and @filter_check(lecture, filter)
          if skip_count < per_page * (page - 1)
            skip_count++
          else
            result.lectures.push lecture

        break if result.lectures.length >= per_page
      return result
    
  class_times_check: (lecture_class_times, search_class_times) ->
    for lecture_class_time in lecture_class_times
      for search_class_time in search_class_times
        @class_time_check(lecture_class_time, search_class_time)

  class_time_check: (lecture_class_time, search_class_time) ->
    return true if search_class_time is ""

    lecture_wday = lecture_class_time[0]
    lecture_start_time = parseFloat(lecture_class_time.replace(/[()]/g, "").split("-")[0].slice(1))
    lecture_duration = parseFloat(lecture_class_time.replace(/[()]/g, "").split("-")[1])
    search_wday = search_class_time[0]
    search_time = parseFloat(search_class_time.slice(1))
    return false if isNaN(search_time) and search_class_time.length isnt 1
    return lecture_wday is search_wday if isNaN(search_time)
    return lecture_wday is search_wday and (lecture_start_time <= search_time < lecture_start_time + lecture_duration)

  increasing_order_inclusion: (a, b) ->
    a = @s(a).replace(/\s+/g, "").toLowerCase()
    b = @s(b).replace(/\s+/g, "").toLowerCase()
    i = j = 0

    while i < a.length and j < b.length
      if a[i] is b[j] then j++ else i++

    return j is b.length

  permutation_inclusion: (a, b) ->
    a = a.replace(/\s+/g, "").toLowerCase()
    b = b.replace(/\s+/g, "").toLowerCase()

    for i in [0..b.length]
      flag = true
      for j in [0..a.length]
        if b[i] is a[j]
          flag = false
          break
      return false if flag
    return true

  upload_timetable_to_facebook: (options, socket) ->
    options = options || {}
    access_token = options.access_token
    base64_data = options.base64_data
    message = options.message.toString('utf8')
    message = message + "\nhttp://snutt.kr"

    filename = "#{__dirname}/timetable_images/#{String((new Date().getTime()))}_"
    filename = filename + "#{Math.floor(Math.random() * 10000)}.png"

    base64Image = base64_data.toString('base64')
    decodedImage = new Buffer(base64Image, 'base64')

    @fs.writeFile filename, decodedImage, (err) ->
      if err
        socket.emit 'facebook_publish_complete', {data: {error: "file save error"}}
        console.log err
      else
        target_url = "https://graph.facebook.com/me/photos?message=#{encodeURIComponent(message)}&access_token=#{access_token}"

        restler.post(target_url, {
          multipart: true
          encoding: "utf8"
          data: { source: restler.file(filename) }
        }).on 'complete', (data) =>
          console.log "photo upload complete! : #{filename}"
          socket.emit 'facebook_publish_complete', {data: JSON.parse(data)}

snutt = new SNUtt()
