var errorBoxStyle = require('./error-style');

var errFun = function (message) {
    return 'function error() { ' +
        '\n  var React = require(\'react\');' +
        '\n  module.exports = React.createElement(\'pre\', {' +
        '\n     style: ' + JSON.stringify(errorBoxStyle) +
        '\n     }, React.createElement(\'code\', {' +
        '\n        style: {}' +
        '\n      },' + JSON.stringify(message) +
        '\n    )' +
        '\n  );' +
        '\n}';
}

errFun.render = function (message) {
    var React = require('react');
    return React.createElement('pre', {
            style: errorBoxStyle
        }, React.createElement('code', {},
            message
        )
    );
}

module.exports = errFun;