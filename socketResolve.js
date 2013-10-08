/**
 * Created by Evgeniy on 04.10.13.
 * Сокет сервер перенаправляющий подключения на сервера API
 * И перенаправление ответов ожидающим сокетам
 */

var io = require('socket.io');
var sclient = require('socket.io-client');

var settings = {
    servers: [
     {
        name: "5ый",
        host: "192.168.0.5",
        port: 3000,
        path: "/resolve"
     },
    {
        name: "21ый",
        host: "192.168.0.21",
        port: 3000,
        path: "/resolve"
    },
    {
        name: "38ый",
        host: "192.168.0.38",
        port: 3000,
        path: "/resolve"
    }
    ]
}

var _clients = {}; //Подключенные клиенты
var _servers = {}; //Подключенные сервера
var _wait = {} //Ожидающие подключения ответы от апи


var connect = function(){
    var _s = settings.servers;
    _s.forEach(function(item){
        var socket = sclient.connect('http://'+item.host+":"+item.port+item.path);
        socket.on("queue_success", function(message){
            console.log(message);
            if(_clients[message.id]){
                _clients[message.id].emit('queue_success', message.data);
                //delete _clients[message.id];
            }else{
                _wait[message.id] = message;
                _wait[message.id].date = new Date();
            }
        });
        socket.on('disconnect', function(socket){
           // delete _servers[socket.id];
        });
        _servers[socket.id] = socket;
        console.log("Connect to"+item.name);
    });


}


var server = io.listen(5000);

server.of('/check_queue').on('connection', function(socket){
    console.log("connect")
    socket.on('check_queue_status', function(message){
        console.log(message);
        if(_wait[message.id]){
            socket.emit('queue_success', _wait[message.id].data);
            delete _wait[message.id];
        }
        else _clients[message.id] = socket;
    });
    socket.on('disconnect',function(socket){
       // delete _clients[socket.id];
    });
});

setInterval(function(){
    for(key in _wait){
        var item = _wait[key];
        var date = new Date();
        if((date - item.date) > 30000){
           delete _wait[key];
        }
    }
}, 1000);

connect();





