/**
 * Created by Evgeniy on 25.10.13.
 */
var http = require('http')
    , connect = require('connect')
    , router = require('./modules/router')
    , urlResolve = require('./modules/reroutingUrl')
    , modules = require('./modules');

var app = connect()
    .use(connect.static(__dirname + '/control_panel'))
    .use(connect.directory(__dirname + '/control_panel/*'))
    .use(connect.bodyParser())
    .use(router.router)
    .use(urlResolve.send)
    .listen(5000);

modules.initialize();

modules.exports = app;
/*var httpServer = http.createServer(5000, app, function(){
    console.log("Create http server on 5000 port");
});*/

