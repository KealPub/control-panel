/**
 * Created by Evgeniy on 04.10.13.
 * Сокет сервер перенаправляющий подключения на сервера API
 * И перенаправление ответов ожидающим сокетам
 */

var io = require('socket.io');
var sclient = require('socket.io-client');
var url = require("url");
var http = require("http");

var settings = {
    servers: [
     {
        name: "5ый",
        host: "192.168.0.5",
        port: 3000,
        path: "/resolve",
        status: true
     },
    {
        name: "21ый",
        host: "192.168.0.21",
        port: 3000,
        path: "/resolve",
        status: true
    },
    {
        name: "38ой",
        host: "192.168.0.38",
        port: 3000,
        path: "/resolve",
        status: true
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

var resolveUrl = function(req, res){
    var pathname = url.parse(req.url).path;
    var server = findActiveServer(settings.servers);
    if(!server){
        console.log(err);
        res.end("Connect error");
        return;
    }

    var options = {
        hostname: server.host,
        port: server.port,
        path: pathname,
        method: req.method
    }

    var body = "";

    var send = http.request(options, function(response){
        response.on("data", function(data){
            res.write(data);
        });
        response.on("end", function(){
            res.end();
        });

    });

    send.on("error", function(err){
        console.log(err);
        res.end("Connect error");
    });

    send.end();

}

var checkStatusServer = function(){
   var servers = settings.servers;
   servers.forEach(function(item, key){
       var req = http.request({
           hostname: item.host,
           port: item.port,
           path: "/status",
           method: "GET"
       }, function(res){

           var body = "";

           res.on("data", function(data){
                body += data;
           });

           res.on("end", function(){
               if(/application\/json.*/.test(res.headers["content-type"])){
                   var status = JSON.parse(body);
                   settings.servers[key].status = checkStatus(status);
               }else{
                   settings.servers[key].status = false;
               }

           });


       });
       req.on("error", function(err){
           settings.servers[key].status = false;
           console.log(item.name+ " is error "+JSON.stringify(err));
       });

       req.end();
   })
}

var checkStatus = function(status){
    console.log(status);
    if(status.memory > 99999999999){
        return false;
    }

    return true;
}

var findActiveServer = function(servers){
    for(num in servers){
        var item = servers[num];
        if(item.status){
            return item;
        }
    }
    return false;
}


var server = http.createServer(resolveUrl);

var socket = io.listen(server);

server.listen(5000);


socket.of('/check_queue').on('connection', function(socket){
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


setInterval(checkStatusServer, 60 * 1000);


checkStatusServer();
connect();





