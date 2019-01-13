var React = require('react'),
	ReactDOMServer = require('react-dom/server'),
	_ = require('lodash'),
	StateService = require('./state-service'),
	CLIENT_VAR = '__EXACT_PROPS__';

module.exports = function createEngine(opts) {
	// default options
	opts || (opts = {});
	var doctype = opts.doctype || '<!DOCTYPE html>';

	var babelRegistered = false,
		factoryCache = Object.create(null);

	return function renderFile(filename, options, cb) {
		// defer babel registration until the first request so we can grab the view path
		if (!babelRegistered) {
			require('babel-core/register')({
				only: options.settings.views,
				presets: ['react', 'es2015', 'stage-3']
			})
			babelRegistered = true;
		}

		var props = _.omit(options, ['settings', '_locals', 'cache']);

		// this needs to be reset between each render
		StateService.reset();
		StateService.locals(props);

		try {
			// grab our cached element factory (or create a new one)
			var factory = factoryCache[filename];
			if (!factory) {
				var view = require(filename);
				factory = factoryCache[filename] = React.createFactory(view);
			}

			// render it to a string
			var element = factory(props),
				html = doctype + ReactDOMServer.renderToString(element),
				scriptTag = buildScript(props, CLIENT_VAR);

			html = html.replace('</head>', scriptTag + '</head>');

			cb(null, html);
		} catch (err) {
			cb(err);
		}
	};
};

function buildScript(props) {
	// note: OWASP suggests encoding other characters as well because HTML attributes can be single, double,
	// or non-quoted. In this case we know that we only double-quote, so the relevant OWASP statement is:
	//   "Properly quoted attributes can only be escaped with the corresponding quote".
	// Read more here: https://www.owasp.org/index.php/XSS_(Cross_Site_Scripting)_Prevention_Cheat_Sheet
	var attrEncodedProps = JSON.stringify(props).replace(/"/g, '&quot;');

	return '<script type="text/javascript" data-exact-props="' + attrEncodedProps + '">' +
				'window.' + CLIENT_VAR + '=' + 'JSON.parse(' +
					'document.querySelector("script[data-exact-props]").getAttribute("data-exact-props")' +
				');' +
			'</script>';
}
