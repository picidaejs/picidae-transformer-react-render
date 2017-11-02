module.exports = function (code) {
	var code = '\n'
	+ 'var exports = {}, module = {};\n'
	+ 'module.exports = exports;\n'
	+ '(' + code + ')(exports, module)\n'
	+ 'return module.exports.default || module.exports;'
	
	return new Function(
		'React', 'Component', 'ReactDOM', 'require',
		code
	);
}