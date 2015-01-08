var connect = require('connect'),
    serveStatic = require('serve-static');
var path =  __dirname + '/build/';
var app = connect();

app.use(serveStatic(path));
app.listen(8080);

