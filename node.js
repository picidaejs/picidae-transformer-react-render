// var cheerio = require('cheerio');
var fs = require('fs');
var nps = require('path');
var transformer = require('./transformer');
var getComponentCreator = require('./getComponentCreator');
var babelCore = require('babel-core')

// var reactDOMServer = require('react-dom/server');
// var react = require('react')

var id = 'transformer-react-render'

module.exports = function (opt, gift, require) {

	// var id = 'tmp.' + Math.random();
	var cheerio = require('cheerio');
	var React = require('react')
	var ReactDOM = require('react-dom')
	var ReactDOMServer = require('react-dom/server')

	var filename = nps.join(__dirname, id + '.js')

	var $ = cheerio.load(gift.data.content, {decodeEntities: true});
	var preElems = $('pre');

	var index = 0;

	preElems.map(function () {
		var preEle = $(this);

		$(this).children('code').map(function() {
			var className = $(this).attr('class');
			var found = className.split(' ').find(function (x) {
				x = x.trim();//.replace(/^language-/, '')
				return x === 'language-' + (opt.lang || 'react-render')
			})
			if (found) {
				var code = $(this).text();
				code = transformer(code);
				var getComponent = getComponentCreator(code);
				
				// console.log(getComponent.toString())
				var reactHTML = ''
				try {
					var Component = getComponent(React, React.Component, ReactDOM, require);
					reactHTML = ReactDOMServer.renderToString(
						React.createElement(Component)
					);
				} catch (err) {
					console.error(err);
					return;
				}

				var html = '<transformer-react-render data-id="' + (index++) + '">' 
						+ reactHTML
					 	+ '</transformer-react-render>';
				preEle.append(html);

				gift.data[id] = gift.data[id] || {};
				gift.data[id].list = gift.data[id].list || []
				gift.data[id].list.push(getComponent.toString());
				if (!gift.data[id].React) {
					gift.data[id].React = {
						PICIDAE_EVAL_CODE: true,
						value: 'require(\'react\')'
					}
					gift.data[id].ReactDOM = {
						PICIDAE_EVAL_CODE: true,
						value: 'require(\'react-dom\')'
					}
				}
				// console.error(preEle.html())
			}
		})
	})

	gift.data.content = $.html();
	return gift.data;
}