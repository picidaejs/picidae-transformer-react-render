var id = 'transformer-react-render'
const utils = require('html-to-react/lib/utils');

module.exports = function (opt) {
	return function (pageData) {
		let {markdown, meta} = pageData;

		let content = pageData.markdown.content;
		let injected = pageData.markdown[id] || {};
		const {list: codeList = [], pkg} = injected;
		const set = {
            'react': React,
            'react-dom': ReactDOM,
            ...pkg
        }

        const React = require('react')
        const ReactDOM = require('react-dom')
		function fakeRequire(p) {
        	return set[p];
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
