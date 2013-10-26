/**
 * Created by Evgeniy on 25.10.13.
 */

var io = require('socket.io')
    , servers = require('./index')
    , socket_settings = require('../config/settings').servers.socket
    , app = require('../controlServer')
    , io_client = require('socket.io-client');

var _clients = {};
var _wait = {};
var _temp = {};


var timeOutOnErrorConnect = 60 * 1000;

//

//var initialize = function(){
//    var servers_arr = servers.getActiveServers();
//
//    for(id in servers_arr){
//        var server = servers_arr[id];
//
//        setConnect(id, server);
//    }
//
//    startListenSocket();
//}

var setConnect = function(id, server){
    var client = io_client.connect(server.host+":"+server.port+server+socket_settings.rerouting_path);

    client.on("queue_success", function(message){
        if(_clients[message.id]) _clients.emit("queue_success", message.data);
        else _wait[message.id] = message.data;
    });

    client.on("error", function(){
        console.log(server.name+ " connect socket error");
        setTimeout(function(){
            setConnect(id, server);
        }, timeOutOnErrorConnect);
    });

    client.on("disconnect", function(){
        console.log(server.name+ " connect socket ");
        client.disconnect();
        setTimeout(function(){
            setConnect(id, server);
        }, timeOutOnErrorConnect);
    });

    server.socket = client;
}

var startListenSocket = function(){

    var socket_server = io.listen(app);

    socket_server.of('/check_queue').on('connection', function(socket){
        socket.on("check_queue_status", function(message){
            if(_wait[message.id]) socket.emit("queue_success", _wait[message.id]);
            else {
                _clients[message.id] = socket;
                _temp[socket.id] = message.id;
            }
        });

        socket.on("disconnect", function(){
            var id = _temp[socket.id];
            delete  _clients[id];
            delete _temp[socket.id];
        });
    });

}

exports.setConnect = setConnect;
exports.startListenSocket = startListenSocket;