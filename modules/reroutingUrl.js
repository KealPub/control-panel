/**
 * Created by Evgeniy on 25.10.13.
 */

var settings = require('../config/settings')
    , http = require('http')
    , querystring = require('querystring');

var send = function(req, res){
    var option = {
        host: '192.168.0.5',
        port: '3000',
        path: req.url,
        method: req.method
    }

    var request = http.request(option, function(responce){

        var body = "";
        responce.on("data", function(data){
             body += data;
        });

        responce.on("end", function(){
           for(header in responce.headers){
               res.setHeader(header, responce.headers[header]);
            }
           res.end(body);
        });
    });

    request.on("error", function(err){
        console.error(err);
    });

    request.write(querystring.stringify(req.body));
    request.end();
}

var getServer = function(){
    var servers = settings.servers;
}

exports.send = send;