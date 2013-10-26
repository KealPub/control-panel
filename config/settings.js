/**
 * Created by Evgeniy on 25.10.13.
 */

var fs = require('fs');

var config_file = 'config/settings.json';

var settings = JSON.parse(
    fs.readFileSync(config_file)
);

settings.save = function(callback){
    fs.writeFile(config_file, JSON.stringify(settings), function(err){
        callback ? callback(err) : "";
    });
}


module.exports = settings;
