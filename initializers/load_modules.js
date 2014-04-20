GLOBAL.url = require('url');
GLOBAL.path = require('path');
GLOBAL.fs = require('fs');
GLOBAL.mime = require('mime');
GLOBAL.restler = require('restler');
GLOBAL.querystring = require('querystring');
GLOBAL.deparam = require('node-jquery-deparam');
GLOBAL._ = require('underscore');
GLOBAL.Router = require('routes');
GLOBAL.s = function(str){
  if (!str) return "";
  return String(str);
}
GLOBAL.Renderer = function(res){
  this.res = res;
  this.json = function(hash){
    this.res.writeHead(200, {"Content-Type": "application/json"});
    this.res.end(JSON.stringify(hash));
  }
  this.text = function(text){
    res.writeHead(200, {'Content-Type' : "text/html"});
    res.end(text);
  }
}
GLOBAL.objectToString = function(o){
  var parse = function(_o){
    var a = [], t;
    for(var p in _o){
      if(_o.hasOwnProperty(p)){
        t = _o[p];
        if(t && typeof t == "object"){
          a[a.length]= p + ":{ " + arguments.callee(t).join(", ") + "}";
        }
        else {
          if(typeof t == "string"){
            a[a.length] = [ p+ ": \"" + t.toString().replace(/"/g, '\\"') + "\"" ];
          }
          else{
            a[a.length] = [ p+ ": " + String(t).replace(/"/g, '\\"')];
          }
        }
      }
    }
    return a;
  }
  return "{" + parse(o).join(", ") + "}";
}