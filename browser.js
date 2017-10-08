var id = 'transformer-react-render'

module.exports = function (opt) {
	return function (pageData) {
		// console.log(pageData.markdown[id]);

		let {markdown, meta} = pageData;
		// console.log('react-render', opt);
		// console.log(pageData);

		let content = pageData.markdown.content;
		let injected = pageData.markdown[id] || {};
		let codeList = injected.list || [];

		let {
			React,
			ReactDOM
		} = injected;

		content.replace(
			/<transformer-react-render data-id="(\d+?)".*?>([^]*?)<\/\s*transformer-react-render>/g,
			(m, idx) => {
				var code = codeList[Number(idx)];
				if (!code) return m;
				code = code.replace(/^\s+/, '');
				var getComp = new Function('return ' + code)();
				// console.log(getComp, meta);
				function fakeRequire(p) {
					return {
						'react': React,
						'react-dom': ReactDOM
					}[p]
				};

				var Component = getComp(React, React.Component, ReactDOM, fakeRequire);

				var callbackCollect = this.callbackCollect;
				// after content rendered

				callbackCollect(function (root) {
					var domList = document.getElementsByTagName(id);
					domList = Array.from(domList)
					var dom = domList.find(function(dom) {return dom.getAttribute('data-id') == idx});
					if (dom) {
						// clearInterval(t);
					}
					if (Component && dom) {
						ReactDOM.render(
							React.createElement(Component, null),
							dom
						)
					}

				})
				return m;
			}
		)

		return pageData;
	}
}
