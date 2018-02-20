
/**
 * @file parseToAst
 * @author Cuttle Cong
 * @date 2018/2/20
 * @description
 */

var babylon = require('babylon')
var traverse = require('babel-traverse').default

var opts = {
  allowImportExportEverywhere: true,
  sourceType: 'module',
  locations: false,
  plugins: [
    'asyncGenerators',
    'classConstructorCall',
    'classProperties',
    'decorators',
    'doExpressions',
    'exportExtensions',
    'flow',
    'functionBind',
    'functionSent',
    'jsx',
    'objectRestSpread',
    'dynamicImport'
  ]
}

function parseToAst(source) {
  return babylon.parse(source, opts)
}


function getLastImportLineNum(es6Code) {
  var ast = parseToAst(es6Code)
  var holder = { number: -1 }

  traverse(ast, {
    CallExpression(path, state) {
      var name = path.get('callee').node.name
      var args = path.node.arguments
      if (name === 'require') {
        holder.number = Math.max(path.node.loc.end.line, holder.number)
      }
    },
    ImportDeclaration(path, state) {
      holder.number = Math.max(path.node.loc.end.line, holder.number)
    }
  }, null, holder)
  return holder.number
}

module.exports = getLastImportLineNum
