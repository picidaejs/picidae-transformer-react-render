var id = 'transformer-react-render'
const utils = require('html-to-react/lib/utils');

module.exports = function (opt) {
	return function (pageData) {
		// console.log(pageData.markdown[id]);

		let {markdown, meta} = pageData;
		// console.log('react-render', opt);
		// console.log(pageData);

		let content = pageData.markdown.content;
		let injected = pageData.markdown[id] || {};
		let codeList = injected.list || [];
		const {callbackCollect} = this;

		let {
			React,
			ReactDOM
		} = injected;

		function fakeRequire(p) {
			return {
				'react': React,
				'react-dom': ReactDOM
			}[p]
		};

		return {
			replaceChildren: false,
			shouldProcessNode: function (node) {
				return node.name === 'transformer-react-render'
						&& ('data-id' in node.attribs)
						&& codeList[Number(node.attribs['data-id'])];
			},
			processNode: function (node, children = [], index) {
				const code = codeList[Number(node.attribs['data-id'])].replace(/^\s+/, '');

				const getComponent = new Function('return ' + code)();
				const Component = getComponent(React, React.Component, ReactDOM, fakeRequire);

				node.name = 'div';
				node.attribs['class'] = 'transformer-react-render';
				delete node.attribs['data-id'];

				const component = <Component />;
                if (!children.length) {
                    children.push(component)
				}
				else {
                	children[0] = component;
				}

				return utils.createElement(node, index, node.data, children);
			}
		}
	}
}
