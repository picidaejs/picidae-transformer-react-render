module.exports = {
  presets: [
    'babel-preset-es2015',
    'babel-preset-react',
    'babel-preset-stage-0'
  ],
  plugins: [
    'babel-plugin-transform-decorators-legacy',
    [
      'babel-plugin-transform-runtime',
      {
        'polyfill': false,
        'regenerator': true
      }
    ]
  ]
}