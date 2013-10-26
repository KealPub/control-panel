/**
 * Created by Evgeniy on 04.10.13.
 * Сокет сервер перенаправляющий подключения на сервера API
 * И перенаправление ответов ожидающим сокетам
 */

var io = require('socket.io');
var sclient = require('socket.io-client');
var url = require("url");
var http = require("http");
var connectM = require('connect');

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
    var servers = findActiveServer(settings.servers);
    if(!servers){
        res.end("Connect error");
        return;
    }

    sendServerData(servers, pathname, req.method, function(err, data){
        if(err) res.end("Connect error")
        else res.end(data);
    })

}

var app = connectM()
    .use(connectM.static(__dirname + '/control_panel'))
    .use(connectM.directory(__dirname + '/control_panel/*'))
    .use(connectM.bodyParser())
    .use(function(req, res, next){
        if(req.url == "/login") login(req,res);
        else next();
    })
    .use(resolveUrl);

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
    var activeServers = [];
    for(num in servers){
        var item = servers[num];
        if(item.status){
            activeServers.push(item);
        }
    }
    if(activeServers.length > 0) return activeServers;
    else return false;
}

var sendServerData = function(servers, path, method, callback, num){
    if(!num) num = 0;

    var server = servers[num];

    var options = {
        hostname: server.host,
        port: server.port,
        path: path,
        method: method
    }

    var body = "";

    var send = http.request(options, function(response){
        response.on("data", function(data){
            body += data;
        });
        response.on("end", function(){
            callback(null, body);
        });

    });

    send.on("error", function(err){
        console.log(server.name+" "+err);
        if(!servers[num + 1]) return callback(err);
        sendServerData(servers, path, method, callback,++num)
    });

    send.end();
}

var login = function(req, res){
    var userdata = req.body;

    if(userdata.login == "admin" && userdata.password == "admin"){
        res.end(JSON.stringify({
            access_token: "testt",
            user_id: "test"
        }));
    }else{
        res.end(JSON.stringify({
            error: "Не верный логин или пароль"
        }));
    }
}

var server = http.createServer(app);

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

socket.of("/monitoring").on('connection', function(socket){
    console.log("A connect");
    socket.emit("test", "test");
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





