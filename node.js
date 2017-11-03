// var cheerio = require('cheerio');
var nps = require('path');
var transformer = require('./transformer');
var getComponentCreator = require('./lib/getComponentCreator');
var babelCore = require('babel-core')
var detective = require('detective')


var id = 'transformer-react-render';

function htmlDecode(str) {
    // 一般可以先转换为标准 unicode 格式（有需要就添加：当返回的数据呈现太多\\\u 之类的时）
    str = unescape(str.replace(/\\u/g, "%u"));
    // 再对实体符进行转义
    // 有 x 则表示是16进制，$1 就是匹配是否有 x，$2 就是匹配出的第二个括号捕获到的内容，将 $2 以对

    str = str.replace(/&#(x)?(\w+);/g, function($, $1, $2) {
        return String.fromCharCode(parseInt($2, $1? 16: 10));
    });

    return str;
}

// exports.remarkTransformer = require('./remark-transformer');
exports.htmlTransformer = function (opt, gift, require) {

    var htmlparser = require('htmlparser2');
    var React = require('react')
    var ReactDOM = require('react-dom')
    var loaderUtils = require('loader-utils');
//
    var alias = opt.alias || {};
    var placement = opt.placement || 'bottom';
    var filesMap = gift.filesMap;
    var path = gift.path;
    var filename = filesMap[path];
    var dirname = nps.dirname(filename);

    var pkgs = ['react', 'react-dom'];

    function insertCode(code, query) {
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

        gift.data[id] = gift.data[id] || {};
        gift.data[id].list = gift.data[id].list || []
        var getComponent = getComponentCreator(code);
        gift.data[id].list.push([getComponent.toString(), query]);

        gift.data[id].pkg = gift.data[id].pkg || {};
        var pkg = gift.data[id].pkg;

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

    var content = gift.data.content;
    var index = 0;

    return new Promise(function (resolve) {
        var tmp = {code: ''},
            opts = {decodeEntities: false};
        var parser = new htmlparser.Parser({
            onopentag: function(name, attrs) {
                var className = '', query;
                if (name === 'code'
                    && (
                        className = attrs.class,
                        query = htmlDecode(attrs['data-query'] || '{}')
                    )
                ) {
                    tmp.query = JSON.parse(query);
                    var found = className && className.split(' ').find(function (x) {
                            x = x.trim();
                            var pos = x.lastIndexOf('?');
                            if (pos >= 0) {
                                x = x.substring(0, pos);
                            }
                            return x === 'language-' + (opt.lang || 'react-render')
                        });

                    if (found) {

                        tmp.incode = true;
                    }
                }
            },
            ontext: function(text) {
                if (tmp.incode) {
                    tmp.code += htmlDecode(text);
                }
            },
            onclosetag: function(name) {
                if (name === 'code' && tmp.incode) {
                    tmp.incode = false;
                    if (tmp.code) {
                        insertCode(tmp.code, tmp.query);
                    }
                    tmp.code = '';
                    tmp.query= {};
                }
            },
            onend: function () {
                resolve(gift.data);
            }
        }, opts);

        gift.data.content = content.replace(
            /<pre.*?>[^]*?(<code.+?class="(.+?)".+?>[^]+?<\/code>)[^]*?<\/pre>/g,
            function (matched, codeHTML, className) {
                var found = className && className.split(' ').find(function (x) {
                        x = x.trim();
                        var pos = x.lastIndexOf('?');
                        if (pos >= 0) {
                            x = x.substring(0, pos);
                        }
                        return x === 'language-' + (opt.lang || 'react-render')
                    });
                var placeholder = '';
                if (found) {
                    placeholder = '<transformer-react-render' + ' data-id="' + (index++) + '">'
                        + '</transformer-react-render>';
                    parser.write(codeHTML);

                    if (placement === 'bottom') {
                        return '<div class="transformer-react-render-container">' + matched + placeholder + '</div>';
                    }
                    else if (placement === 'top') {
                        return '<div class="transformer-react-render-container">' + placeholder + matched + '</div>';
                    }
                }

                return matched;
            }
        );

        parser.end();
    });

}
