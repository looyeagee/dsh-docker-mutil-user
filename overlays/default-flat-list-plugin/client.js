window.__ModuleLoader__.load({
	id: "@docker-dsh/default-flat-list",
	factory: () => {
		var module = { exports: {} };
		var exports = module.exports;

		const persistKey = "dsh.workspace.view.v5";
		const inject = [];

		function seedFlatList() {
			if (typeof localStorage === "undefined") return;
			if (localStorage.getItem(persistKey) !== null) return;
			localStorage.setItem(persistKey, JSON.stringify({
				groupBy: "flat",
				orderBy: "updated",
				groupExpansion: {},
				sessionOrderByAccount: {},
				sessionUpdatedAtByAccount: {},
			}));
		}

		seedFlatList();

		function apply() {
			seedFlatList();
		}

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
