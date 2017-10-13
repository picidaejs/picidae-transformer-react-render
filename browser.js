var id = 'transformer-react-render'
const utils = require('html-to-react/lib/utils');

module.exports = function (opt) {
    return function (pageData) {
        // console.log(pageData.markdown[id]);

        let {markdown, meta} = pageData;
        // console.log('react-render', opt);

        let ReactDOM = require('react-dom')
        let React = require('react')

        let content = pageData.markdown.content;
        let injected = pageData.markdown[id] || {};
        let codeList = injected.list || [];
        let pkg = injected.pkg || {};

        function fakeRequire(p) {
            return {
                ...pkg,
                'react': React,
                'react-dom': ReactDOM,
            }[p]
        };

        return [
            {
                replaceChildren: false,
                shouldProcessNode: function (node) {
                    return node.parent && node.parent.name === 'div'
                        && ('class' in node.parent.attribs)
                        && node.parent.attribs['class'].includes('transformer-react-render-container')
                        && node.name === 'pre';
                },
                processNode: function (node, children = [], index) {
                    var placeholder = node.next && node.next.name === 'transformer-react-render' ? node.next : node.prev;
                    if (!placeholder || !('data-id' in placeholder.attribs)) {
                        return utils.createElement(node, index, node.data, children);
                    }

                    var ent = codeList[Number(placeholder.attribs['data-id'])];
                    const code = ent[0].replace(/^\s+/, '');
                    var query = ent[1] || {};
                    if (query.hide) {
                        return null;
                    }
                    return utils.createElement(node, index, node.data, children);
                }
            },
            {
                replaceChildren: false,
                shouldProcessNode: function (node) {
                    return node.name === 'transformer-react-render'
                        && ('data-id' in node.attribs)
                        && codeList[Number(node.attribs['data-id'])];
                },
                processNode: function (node, children = [], index) {
                    var ent = codeList[Number(node.attribs['data-id'])];
                    const code = ent[0].replace(/^\s+/, '');

                    const getComponent = new Function('return ' + code)();
                    const Component = getComponent(React, React.Component, ReactDOM, fakeRequire);

                    node.name = 'div';
                    node.attribs['class'] = 'transformer-react-render';
                    // delete node.attribs['data-id'];

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
        ]
    }
}
