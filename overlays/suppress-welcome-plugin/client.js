window.__ModuleLoader__.load({
	id: "@docker-dsh/suppress-welcome",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		var React = require("react");

		const inject = ["slots"];

		function SuppressWelcome({ complete }) {
			React.useEffect(() => {
				complete();
			}, [complete]);
			return null;
		}

		function apply(ctx) {
			ctx.slots.inject("settings.onboarding", () => ctx.slots.register({
				name: "settings.onboarding",
				id: "welcome-notice",
				order: -100,
				priority: -1,
			}, SuppressWelcome));
		}

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
