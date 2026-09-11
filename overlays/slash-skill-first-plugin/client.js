window.__ModuleLoader__.load({
	id: "@docker-dsh/slash-skill-first",
	factory: () => {
		var module = { exports: {} };
		var exports = module.exports;

		const inject = ["inputTriggers"];
		const skillOrder = -1;

		function isSkillSource(src) {
			return src != null && src.trigger === "/" && src.name === "skill";
		}

		function preferSkill(src) {
			if (isSkillSource(src)) src.order = skillOrder;
			return src;
		}

		function registeredSources(svc) {
			if (Array.isArray(svc.live?.sources)) return svc.live.sources;
			for (const key of Object.getOwnPropertyNames(svc)) {
				const val = svc[key];
				if (val && typeof val === "object" && Array.isArray(val.sources)) {
					return val.sources;
				}
			}
			return [];
		}

		function apply(ctx) {
			ctx.inject(["inputTriggers"], (scope) => {
				const svc = scope.inputTriggers;
				const orig = svc.registerSource.bind(svc);
				ctx.effect(() => {
					svc.registerSource = (src) => orig(preferSkill(src));
					for (const src of registeredSources(svc)) preferSkill(src);
					return () => {
						svc.registerSource = orig;
					};
				}, "slash-skill-first: skill group first");
			});
		}

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
