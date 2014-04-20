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

//b's elements are members of a's elements with increasing order
GLOBAL.increasing_order_inclusion = function(a,b)
{
  a = s(a).replace(/ /g, "").toLowerCase();
  b = s(b).replace(/ /g, "").toLowerCase();
  var i=0,j=0;
  while (i<a.length && j<b.length){
    if (a[i] == b[j]) j++;
    else i++;
  }
  return (j == b.length);
}

//b's elements are members of a's elements (a>b)
GLOBAL.permutation_inclusion = function(a, b)
{
  a = a.replace(/ /g, "").toLowerCase();
  b = b.replace(/ /g, "").toLowerCase();
  for(var i=0;i<b.length;i++){
    var flag = true;
    for (var j=0;j<a.length;j++){
      if (b[i] == a[j]){
        flag = false;
        break;
      }
    }
    if(flag) return false;
  }
  return true;
}
