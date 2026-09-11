window.__ModuleLoader__.load({
	id: "@docker-dsh/hide-settings-sections",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;

		const inject = ["slots"];
		const hidden = ["models", "plugins", "agent-presets"];
		const hiddenIds = new Set(hidden);

		function HiddenSection() {
			return null;
		}

		function apply(ctx) {
			const orig = ctx.slots.entries.bind(ctx.slots);
			ctx.effect(() => {
				ctx.slots.entries = (key) => {
					const list = orig(key);
					if (key !== "settings.section") return list;
					return list.filter((entry) => !hiddenIds.has(entry.options.id));
				};
				return () => {
					ctx.slots.entries = orig;
				};
			}, "hide-settings-sections: drop nav rows");

			ctx.slots.inject("settings.section", () => {
				const stop = hidden.map((id) => ctx.slots.register({
					name: "settings.section",
					id,
					priority: -1,
				}, HiddenSection));
				return () => {
					for (const dispose of stop) dispose();
				};
			});
		}

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
