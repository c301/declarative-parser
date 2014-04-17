var connect = require('connect');
console.log( __dirname + '/build/public/')
connect.createServer(
    connect.static(__dirname + '/build/public/')
).listen(8080);