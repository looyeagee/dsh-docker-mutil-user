window.__ModuleLoader__.load({
	id: "@docker-dsh/workspace-html-preview",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		var jsx = require("react/jsx-runtime");

		const inject = ["documentPreviews", "slots"];
		const ID = "@docker-dsh/workspace-html-preview";
		const frameStyle = {
			display: "block",
			width: "100%",
			height: "100%",
			minHeight: "240px",
			border: "none",
			background: "var(--dsw-alias-bg-base)",
		};

		function workspaceHref(path) {
			if (typeof path !== "string") return null;
			const normalized = path.replaceAll("\\", "/");
			if (!normalized.startsWith("/workspace/")) return null;
			const parts = normalized.split("/");
			for (const part of parts) {
				if (part === ".." || part === ".") return null;
			}
			if (parts.length < 3 || parts[parts.length - 1] === "") return null;
			return parts.map((part, index) => (index === 0 ? "" : encodeURIComponent(part))).join("/");
		}

		function addressPath(address) {
			if (typeof address !== "string" || !address.startsWith("dsh-resource://file/session/")) return "";
			const rest = address.slice("dsh-resource://file/session/".length);
			const slash = rest.indexOf("/");
			if (slash < 0) return "";
			const encoded = rest.slice(slash + 1).split(/[?#]/, 1)[0];
			try {
				return encoded.split("/").map((part) => decodeURIComponent(part)).join("/");
			} catch {
				return encoded;
			}
		}

		function underWorkspace(path) {
			if (typeof path !== "string" || path === "") return null;
			if (path.startsWith("/workspace/")) return path;
			if (path.startsWith("/") || path.startsWith("..") || path.includes("/../")) return null;
			return `/workspace/${path}`;
		}

		function WorkspaceHtmlBody(props) {
			const meta = props.useResource(props.resourceAddress);
			const href = workspaceHref(meta?.value?.absolutePath)
				|| workspaceHref(addressPath(props.resourceAddress))
				|| workspaceHref(underWorkspace(addressPath(props.resourceAddress)));
			if (href === null) return null;
			return jsx.jsx("iframe", {
				style: frameStyle,
				src: href,
				sandbox: "allow-scripts",
				title: "HTML",
				"data-html-preview": "",
				"data-workspace-html": href,
			});
		}

		function apply(ctx) {
			ctx.inject(["documentPreviews", "slots"], (scope) => {
				scope.effect(() => scope.documentPreviews.register({
					id: ID,
					extensions: ["html", "htm"],
					priority: "extension",
					title: () => "工作区网页",
					loading: "bytes-complete",
					wrap: false,
				}), "workspace-html-preview: definition");
				scope.effect(() => scope.slots.inject("sidebar.right.tab.document", () => scope.slots.register({
					name: "sidebar.right.tab.document",
					key: ID,
				}, WorkspaceHtmlBody)), "workspace-html-preview: body");
			});
		}

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
