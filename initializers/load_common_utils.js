GLOBAL.s = function(str) {
    if (!str) return "";
    return String(str);
}

GLOBAL.Renderer = function(res) {
    this.json = function(hash) {
        res.writeHead(200, {"Content-Type": "application/json"});
        res.end(JSON.stringify(hash));
    }

    this.text = function(text) {
        res.writeHead(200, {'Content-Type' : "text/html"});
        res.end(text);
    }
}

GLOBAL.objectToString = function(obj) {
    var res = "";
    function join(str) {
        if(res)
            res += ", " + str;
        else
            res += str;
    }
    for(var p in obj) {
        if(obj.hasOwnProperty(p)) {
            var val = obj[p];
            if(val && typeof val == "object")
                join(p + ":" + objectToString(val));
            else if(typeof val == "string")
                join(p+ ": \"" + val.replace(/"/g, '\\"') + "\"");
            else
                join(p+ ": " + String(val).replace(/"/g, '\\"'));
        }
    }
    return "{" + res + "}";
}

// Tell if each element of b is a member of a with increasing order
GLOBAL.increasing_order_inclusion = function(a, b) {
    a = s(a).replace(/ /g, "").toLowerCase();
    b = s(b).replace(/ /g, "").toLowerCase();

    var i, j;
    i = 0;
    j = 0;
    while (i < a.length && j < b.length) {
        if (a[i] == b[j])
            j++;
        else
            i++;
    }
    return j == b.length;
}

// Tell if each element of b is a member of a
GLOBAL.permutation_inclusion = function(a, b) {
    a = a.replace(/ /g, "").toLowerCase();
    b = b.replace(/ /g, "").toLowerCase();
    
    for(var i = 0; i < b.length; i++) {
        if(a.indexOf(b[i]) == -1)
            return false;
    }
    return true;
}
