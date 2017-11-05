const id = 'transformer-react-render'
let ReactDOM = require('react-dom')
let React = require('react')
const utils = require('html-to-react/lib/utils');
const errorFunc = require('./lib/error-func');
const getComponentCreator = require('./lib/getComponentCreator');
import Editor from 'react-code-editor';

function toString(node) {
  if (node.type === 'text') {
      return node.data;
  }

  if (node.type === 'tag') {
      return node.children.reduce((s, a) =>
          s + toString(a)
      , '');
  }
}

function getComponetMultiWay(Comp) {
    if (React.isValidElement(Comp)) return Comp
    if (typeof Comp !== 'function') return null

    return <Comp />
}

function injectScript(data = {}, autoAppend = true) {
    const {src, type = 'text/javascript', ...props} = data;
    const script = document.createElement('script');
    Object.assign(script, data);
    autoAppend && document.head.appendChild(script);
    return script;
}

injectBabel.injected = false;
async function injectBabel() {
    if (injectBabel.injected) {
        return;
    }
    const babelCDN = 'https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/6.26.0/babel.min.js'
    const script = injectScript({async: true, src: babelCDN});
    injectBabel.injected = true;
    return new Promise(resolve => {
        script.onload = function () {
            resolve();
        }
    });
}

// const transformer = require('./transformer');

const errorBox = require('./lib/error-style')

module.exports = function (opt) {


    return function (pageData) {
        let {markdown, meta} = pageData;

        let content = pageData.markdown.content;
        let injected = pageData.markdown[id] || {};
        let codeList = injected.list || [];
        let pkg = injected.pkg || {};

        pkg = {
            ...pkg,
            'react': React,
            'react-dom': ReactDOM,
        };

        function fakeRequire(p) {
            if (!(p in pkg)) {
                throw new Error(` React-Render: Module \`${p}\` is Not Found`);
            }
            return pkg[p];
        }

        function callGetComponent(getComponent) {
            return getComponent(React, React.Component, ReactDOM, fakeRequire);
        }

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
                    const dataId = placeholder.attribs['data-id'];

                    var ent = codeList[Number(dataId)];
                    var query = ent[1] || {};
                    query = Object.assign({}, opt, query);
                    if (query.hide) {
                        return null;
                    }
                    if (query.editable) {
                        const code = toString(node);
                        const onBlur = evt => {
                            const placeholderEle = document.querySelector(`.transformer-react-render[data-id="${dataId}"]`);

                            if (placeholderEle) {
                                const ele = evt.target;
                                const es6Code = ele.innerText;

                                injectBabel()
                                    .then(() => {
                                        const babel = window.Babel;

                                        let code = null;
                                        let Component = null;
                                        try {
                                            code = babel.transform(es6Code, {
                                                ...require('./lib/babel-config'),
                                                ast: false
                                            }).code;
                                            code = new Function(code).toString();
                                            Component = callGetComponent(getComponentCreator(code));
                                        } catch (e) {
                                            console.error(e);
                                            Component = errorFunc.render(e.toString());
                                        }
                                        Component = getComponetMultiWay(Component);
                                        Component ? ReactDOM.render(
                                            Component,
                                            placeholderEle
                                        ) : (
                                            ReactDOM.unmountComponentAtNode(placeholderEle)
                                        )
                                    });
                            }

                        };
                        const onKeyDown = evt => {
                            if (
                                // Cmd/Ctrl + S
                                evt.ctrlKey !== evt.metaKey
                                && evt.keyCode === 83
                            ) {
                                evt.preventDefault();
                                onBlur(evt);
                            }
                        }

                        return <Editor
                            onKeyDown={onKeyDown}
                            onBlur={onBlur}
                            tabSize={4}
                            spellCheck="true"
                            language="jsx"
                            mountStyle={false}
                            code={code}
                            className="language-jsx"
                        />;
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
                    let Component = null;
                    try {
                        const getComponent = new Function('return ' + code)();
                        Component = callGetComponent(getComponent);
                    } catch (ex) {
                        Component = () => errorFunc.render(ex.toString());
                    }

                    node.name = 'div';
                    node.attribs['class'] = 'transformer-react-render';

                    const component = getComponetMultiWay(Component);
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
