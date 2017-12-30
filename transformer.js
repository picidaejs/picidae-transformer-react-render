'use strict'

var babel = require('picidae/exports/babel-core')
var types = babel.types
var traverse = babel.traverse
var generator = require('babel-generator').default
var errFunc = require('./lib/error-func')

function requireGenerator(varName, moduleName) {
  return types.variableDeclaration('var', [
    types.variableDeclarator(
      types.identifier(varName),
      types.callExpression(
        types.identifier('require'),
        [types.stringLiteral(moduleName)]
      )
    )
  ])
}

var defaultBabelConfig = require('./lib/babel-config')

module.exports = function transformer(code,
                                      filename,
                                      babelConfig = {}) {
  var codeAst = null
  try {
    var ast = babel.transform(code, Object.assign({}, defaultBabelConfig, babelConfig)).ast
    codeAst = ast
  } catch (e) {
    console.error(e)
    return errFunc(e.toString())
  }

  var renderReturn = null
  traverse(codeAst, {
    CallExpression: function (callPath) {
      var callPathNode = callPath.node
      if (callPathNode.callee &&
          callPathNode.callee.object &&
          callPathNode.callee.object.name === 'ReactDOM' &&
          callPathNode.callee.property &&
          callPathNode.callee.property.name === 'render') {

        renderReturn = types.returnStatement(
          callPathNode.arguments[0]
        )

        callPath.remove()
      }
    }
  })

  var astProgramBody = codeAst.program.body
  // if (!noreact) {
  // astProgramBody.unshift(requireGenerator('ReactDOM', 'react-dom'));
  // astProgramBody.unshift(requireGenerator('React', 'react'));
  // }
  // ReactDOM.render always at the last of preview method
  if (renderReturn) {
    astProgramBody.push(renderReturn)
  }

  var codeBlock = types.BlockStatement(astProgramBody)
  // console.log(codeBlock);
  var previewFunction = types.functionDeclaration(
    types.Identifier('picidaeTransformerReactRender'),
    [],
    codeBlock
  )

  return generator(types.program([previewFunction]), { minified: true, filename: filename }, code).code
}
