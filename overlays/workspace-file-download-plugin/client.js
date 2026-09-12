window.__ModuleLoader__.load({
	id: "@docker-dsh/workspace-file-download",
	factory: () => {
		var module = { exports: {} };
		var exports = module.exports;

		const inject = [];
		const styleId = "docker-dsh-workspace-file-download";
		const linkClass = "docker-dsh-file-download";
		const icon = [
			'<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">',
			'<path d="M15.3695 11.411L15.1234 12.8866C14.8869 14.3042 13.6603 15.3436 12.223 15.3436H3.77673C2.33958 15.3434 1.1128 14.3042 0.876343 12.8866L0.630249 11.411L2.05408 11.1747L2.29919 12.6493C2.41973 13.3713 3.04475 13.9001 3.77673 13.9003H12.223C12.9551 13.9002 13.58 13.3713 13.7006 12.6493L13.9457 11.1747L15.3695 11.411ZM8.72205 8.994C8.77717 8.93934 8.83792 8.88106 8.90271 8.81627L12.4828 5.23424L13.5043 6.25572L9.92224 9.8358C9.6395 10.1185 9.38763 10.3732 9.15857 10.5575C8.91892 10.7503 8.63953 10.9224 8.2865 10.9784C8.09711 11.0083 7.90363 11.0083 7.71423 10.9784C7.36106 10.9224 7.0809 10.7503 6.84119 10.5575C6.61215 10.3732 6.36022 10.1185 6.07751 9.8358L2.49646 6.25572L3.51697 5.23424L7.09705 8.81627C7.16219 8.88142 7.22331 8.94006 7.27869 8.99498V1.3065H8.72205V8.994Z" fill="currentColor"/>',
			"</svg>",
		].join("");

		function underWorkspaceDir(path) {
			return path === "/workspace" || (typeof path === "string" && path.startsWith("/workspace/"));
		}

		function workspaceHref(path) {
			if (typeof path !== "string") return null;
			const normalized = path.replaceAll("\\", "/");
			if (!underWorkspaceDir(normalized)) return null;
			const parts = normalized.split("/");
			for (const part of parts) {
				if (part === ".." || part === ".") return null;
			}
			if (parts.length < 3 || parts[parts.length - 1] === "") return null;
			return parts.map((part, index) => (index === 0 ? "" : encodeURIComponent(part))).join("/");
		}

		function decorateTree(tree) {
			const enabled = underWorkspaceDir(tree.getAttribute("data-files-root") || "");
			if (!enabled) {
				for (const link of tree.querySelectorAll("." + linkClass)) link.remove();
				return;
			}
			for (const item of tree.querySelectorAll('[data-files-entry="file"][data-files-path]')) {
				const href = workspaceHref(item.getAttribute("data-files-path"));
				if (href === null) continue;
				let link = item.querySelector(":scope > ." + linkClass);
				if (link === null) {
					link = document.createElement("a");
					link.className = linkClass;
					link.target = "_blank";
					link.rel = "noopener noreferrer";
					link.title = "下载";
					link.setAttribute("aria-label", "下载");
					link.innerHTML = icon;
					link.addEventListener("click", (event) => { event.stopPropagation(); });
					item.appendChild(link);
				}
				if (link.getAttribute("href") !== href) link.setAttribute("href", href);
			}
		}

		function decorateAll() {
			if (typeof document === "undefined") return;
			for (const tree of document.querySelectorAll("[data-files-root]")) decorateTree(tree);
		}

		function apply(ctx) {
			ctx.effect(() => {
				if (typeof document === "undefined") return () => {};
				if (document.getElementById(styleId) === null) {
					const style = document.createElement("style");
					style.id = styleId;
					style.textContent = [
						'[data-files-entry="file"]{position:relative;}',
						'[data-files-entry="file"]>button{padding-right:32px;}',
						"." + linkClass + "{",
						"  position:absolute;right:4px;top:50%;transform:translateY(-50%);",
						"  display:inline-flex;align-items:center;justify-content:center;",
						"  width:28px;height:28px;border-radius:28px;",
						"  color:var(--dsw-alias-label-secondary);",
						"  text-decoration:none;",
						"}",
						"." + linkClass + ":hover{",
						"  color:var(--dsw-alias-label-primary);",
						"  background:var(--dsw-alias-interactive-bg-hover);",
						"}",
					].join("");
					document.head.appendChild(style);
				}
				const observer = new MutationObserver(decorateAll);
				observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-files-root", "data-files-path", "data-files-entry"] });
				decorateAll();
				return () => {
					observer.disconnect();
					for (const link of document.querySelectorAll("." + linkClass)) link.remove();
					const style = document.getElementById(styleId);
					if (style) style.remove();
				};
			}, "workspace-file-download: decorate file rows");
		}

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
