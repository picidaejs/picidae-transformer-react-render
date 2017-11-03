var visit = require('unist-util-visit')
var toString = require('mdast-util-to-string')
var loaderUtils = require('loader-utils')
var less = require('less');

var id = 'transformer-react-render';

var transformer = require('./transformer');
var detective = require('detective');
var getComponentCreator = require('./lib/getComponentCreator');
var nps = require('path');
function insertCode(code, query, data, dirname, alias) {
    var pkgs = ['react', 'react-dom'];
    code = transformer(code);
    var pkgsInCode = detective(code);

    var containsUnknownPkg = pkgsInCode.some(function (codePkg) {
        function notExists() {
            try {
                require.resolve(tmp);
            } catch (ex) {
                console.error('module: `' + codePkg + '` not found');
                console.error('   in file: ' + filename);
                return true;
            }
        }
        var tmp = codePkg.trim();
        if (tmp.startsWith('.')) {
            tmp = nps.join(dirname, tmp);
            if (notExists()) return //true;
            pkgs.push({name: codePkg, id: require.resolve(tmp)});
        }
        else if (tmp.startsWith('/')) {
            if (notExists()) return //true;
            pkgs.push({name: codePkg, id: tmp});
        } else {
            var chunks = tmp.split('/')
            if (alias[chunks[0]]) {
                tmp = nps.join(alias[chunks[0]], chunks.slice(1).join('/'));
                if (notExists()) return //true;
                pkgs.push(codePkg);
            }
            else {
                if (notExists()) return //true;
                pkgs.push(codePkg);
            }
        }
    });

    if (containsUnknownPkg) {
        return;
    }

    data.list = data.list || []
    var getComponent = getComponentCreator(code);
    data.list.push([getComponent.toString(), query]);

    data.pkg = data.pkg || {};
    var pkg = data.pkg;

    pkgs.forEach(function (pkgName) {
        if (typeof pkgName === 'string') {
            pkg[pkgName] = {
                PICIDAE_EVAL_CODE: true,
                value: 'require(\'' + pkgName + '\')'
            }
        }
        else {
            pkg[pkgName.name] = {
                PICIDAE_EVAL_CODE: true,
                value: 'require(\'' + pkgName.id + '\')'
            }
        }
    });
}


module.exports = function (opts) {
    var lang = opts.lang || 'react-render';

    var picidae = this.picidae();
    var gift = picidae.info;
    var data = {};

    var React = require('react')
    var ReactDOM = require('react-dom')
    var loaderUtils = require('loader-utils');
//
    var alias = opts.alias || {};
    var placement = opts.placement || 'bottom';
    var filesMap = gift.filesMap;
    var path = gift.path;
    var filename = filesMap[path];
    var dirname = nps.dirname(filename);

    return function search (node) {
        var outerIndex = 0;
        var visitedList = [];

        visit(node, 'code', function (codeNode, index, parent) {
            if (visitedList.includes(codeNode)) {
                return;
            }
            visitedList.push(codeNode);

            var language = codeNode.lang || '';
            var indexOfQ = language.lastIndexOf('?');
            var query = {};
            if (indexOfQ >= 0) {
                query = loaderUtils.parseQuery(language.substring(indexOfQ));
                language = language.substring(0, indexOfQ);
            }

            if (language === lang) {
                codeNode.lang = language;
                // console.log('codeNode.data', codeNode.data)
                codeNode.data = codeNode.data || {};
                // codeNode.data = codeNode.data || {}
                codeNode.data.hProperties = codeNode.data.hProperties || {};
                // var code = toString(codeNode);
                // insertCode(code, query, data, dirname, alias);

                // placeholder = {
                //     type: 'html',
                //     value: '<transformer-react-render' + ' data-id="' + (outerIndex++) + '">'
                //     + '</transformer-react-render>'
                // };

                // if (placement === 'bottom') {
                //     parent.children.splice(
                //         index, 1,
                //         {
                //             type: 'html',
                //             value: '<div class="transformer-react-render-container">'
                //         },
                //         codeNode,
                //         placeholder,
                //         {
                //             type: 'html',
                //             value: '</div>'
                //         }
                //     );
                // } else if (placement === 'top') {
                //     parent.children.splice(
                //         index, 1,
                //         {
                //             type: 'html',
                //             value: '<div class="transformer-react-render-container">'
                //         },
                //         placeholder,
                //         codeNode,
                //         {
                //             type: 'html',
                //             value: '</div>'
                //         }
                //     );
                // }

            }
        });
        picidae.inject(id, data);
        return node;
    }
}
