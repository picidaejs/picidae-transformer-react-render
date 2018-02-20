const id = 'transformer-react-render'
import React from 'picidae/exports/react'
import ReactDOM from 'picidae/exports/react-dom'
import {utils} from 'picidae/exports/html-to-react'
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
async function injectBabel(cdn = 'https://unpkg.com/babel-standalone@6.26.0/babel.min.js') {
    if (injectBabel.injected) {
        return;
    }
    const babelCDN = cdn
    const script = injectScript({async: true, src: babelCDN});
    injectBabel.injected = true;
    return new Promise(resolve => {
        script.onload = function () {
            resolve();
        }
    });
}

// const transformer = require('./transformer');
import './style.less'
const errorBox = require('./lib/error-style')

module.exports = function (opt) {
    const editorProps = opt.editorProps;
    const babelStandaloneCDN = opt.babelStandaloneCDN;

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
                    var lineNumber = ent[2];
                    query = Object.assign({}, opt, query);
                    if (query.hide) {
                        return null;
                    }

                    if (query.editable) {
                        let code = toString(node);
                        let lines = code.split('\n'), prefixCode = ''
                        if (lineNumber && lineNumber != '-1') {
                            prefixCode = lines.slice(0, lineNumber).join('\n')
                            code = lines.slice(lineNumber).join('\n')
                        }                     

                        const onBlur = async evt => {
                            const placeholderEle = document.querySelector(`.transformer-react-render[data-id="${dataId}"]`);

                            if (placeholderEle) {
                                const ele = evt.target;
                                // @todo maybe more information after
                                const holder = {
                                  es6Code: prefixCode + '\n' + ele.innerText
                                }
                                // picidae V2.1.16
                                if (global.__picidae__emitter) {
                                    await global.__picidae__emitter.emit('react-render.holder', holder)
                                }
                                injectBabel(babelStandaloneCDN)
                                    .then(() => {
                                        const babel = window.Babel;

                                        let code = null;
                                        let Component = null;
                                        try {
                                            code = babel.transform(holder.es6Code, {
                                                ...require('./lib/babel-standlone-config'),
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
                        const onKeyDown = async evt => {
                            if (
                                // Cmd/Ctrl + S
                                evt.ctrlKey !== evt.metaKey
                                && evt.keyCode === 83
                            ) {
                                evt.preventDefault();
                                await onBlur(evt);
                            }
                        }
                        
                        // console.log(prefixCode)

                        return (
                            <Editor
                                tabSize={4}
                                spellCheck="true"
                                language="jsx"
                                className="language-jsx"
                                mountStyle={false}
                                {...editorProps}
                                code={code}
                                prefixCode={prefixCode}
                                onKeyDown={onKeyDown}
                                onBlur={onBlur}
                            />
                        )
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
