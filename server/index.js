const static = require('node-static');
const http = require('http');

exports.init = async function () {
    try {
        const file = new(static.Server)(__dirname);

        http.createServer(function (req, res) {
          file.serve(req, res);
        }).listen(8889);
    } catch (error) {
        Homey.app.log(error);
    }
}