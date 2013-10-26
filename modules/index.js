/**
 * Created by Evgeniy on 25.10.13.
 */
var settings = require('../config/settings')
    , net = require('net')
    , socket = require('./reroutingSocket');


var servers = [];

var timeOutOnErrorConnect = 60 * 1000;

var initialize = function(){
    for(id in settings.servers.connect){
        var server = settings.servers.connect[id];
        setConnect(id, server);
        socket.setConnect(id, server);
    }
}

var setConnect = function(id, server){

    var connect = net.connect({
        host: server.host,
        port: 4815
    }, function(){
        console.log("Connect to "+server.name);
        server.connect = true;
    });

    connect.on("error", function(err){
        console.log("Error connect to "+server.name+ " "+JSON.stringify(err));
        server.connect = false;
        setTimeout(function(){ setConnect(id, server) }, timeOutOnErrorConnect);
    });

    connect.on("data", function(data){
        readData(id, data);
    });

    connect.on("end", function(){
        console.log(server.name + " disconnect");
        server.connect = false;
        setTimeout(function(){ setConnect(id, server) }, timeOutOnErrorConnect);
    });

    server.status_connect = connect;


    servers[id] = server;
}

var readData = function(id, data){
    console.log(data);
}

exports.initialize = initialize;

exports.servers = servers;



// ====== Helpers
exports.getActiveServers = function(){
    var active = [];
    for(id in servers){
        if(servers[id].connect){
            active[id] = servers[id];
        }
    }

    return active;
}