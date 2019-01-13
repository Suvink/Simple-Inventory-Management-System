var React = require('react'),
	ReactDOM = require('react-dom');

module.exports = {
	boot: function bootClient(opts, cb) {
		var view = opts.view;

		ReactDOM.render(
			React.createElement(view, window.__EXACT_PROPS__),
			document,
			cb
		);
	},
	locals: function() {
		return window.__EXACT_PROPS__;
	}
};
