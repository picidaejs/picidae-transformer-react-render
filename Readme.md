# picidae-transformer-react-render

## *Support*

We can write something in markdown syntax as blow.

````markdown
```react-render
export default () => <h1>Hello React Render</h1>
```
````

The `react-render` React Code will be rendered when the markdown is rendered.

And we can hide the code View written as blow:  
````markdown
```react-render?hide
export default () => <h1>Hello React Render</h1>
```
````

## Option

- lang: string (default: `'react-render'`)  
- editable: boolean (default: `false`)
- babelStandaloneCDN: string (default: `'https://unpkg.com/babel-standalone@6.26.0/babel.min.js'`)
- editorProps: Object | null (react-code-editor's props)
- placement: string: `'bottom' | 'top'`  
  the placement of react component view. (default: `'bottom'`)
