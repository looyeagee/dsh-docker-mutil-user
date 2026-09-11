window.__ModuleLoader__.load({
	id: "@docker-dsh/whoami",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		var React = require("react");
		var jsx = require("react/jsx-runtime");
		var store = require("@deepseek-ai/dsh-client-store");
		var primitives = require("@deepseek-ai/dsh-client-ui-primitives");

		const inject = ["slots"];

		const triggerStyle = {
			display: "flex",
			alignItems: "center",
			margin: 0,
			border: "none",
			background: "transparent",
			color: "var(--dsw-alias-label-secondary)",
			fontFamily: "inherit",
			cursor: "pointer",
			userSelect: "none",
		};

		function WhoamiLabel({ wide, useUsername }) {
			const username = useUsername((value) => value);
			const [open, setOpen] = React.useState(false);
			if (!username) return null;
			const label = "登录用户：" + username;
			return jsx.jsxs(React.Fragment, {
				children: [
					jsx.jsx("button", {
						type: "button",
						title: label,
						"aria-label": label,
						onClick: () => { setOpen(true); },
						style: wide
							? {
								...triggerStyle,
								height: "42px",
								width: "100%",
								padding: "0 10px 0 8px",
								fontSize: "14px",
								lineHeight: "22px",
								overflow: "hidden",
								whiteSpace: "nowrap",
								textOverflow: "ellipsis",
							}
							: {
								...triggerStyle,
								justifyContent: "center",
								width: "36px",
								height: "36px",
								padding: 0,
								fontSize: "12px",
							},
						children: wide ? label : username.slice(0, 1).toUpperCase(),
					}),
					jsx.jsx(primitives.Modal, {
						open,
						onClose: () => { setOpen(false); },
						title: "退出登录",
						closeLabel: "关闭",
						description: "是否退出登录？",
						footer: jsx.jsxs(jsx.Fragment, {
							children: [
								jsx.jsx(primitives.Button, {
									variant: "outline",
									onClick: () => { setOpen(false); },
									children: "取消",
								}),
								jsx.jsx(primitives.Button, {
									variant: "primary",
									onClick: () => { window.location.assign("/logout"); },
									children: "确认",
								}),
							],
						}),
					}),
				],
			});
		}

		function apply(ctx) {
			const username = store.createSnapshotStore("");
			ctx.effect(() => {
				const ac = new AbortController();
				fetch("/me", { signal: ac.signal, headers: { Accept: "application/json" } })
					.then((response) => response.ok ? response.json() : Promise.reject(response.status))
					.then((body) => {
						if (body && typeof body.username === "string") username.set(body.username);
					})
					.catch(() => {
						// /me only exists behind the gateway; a direct Host has nothing to show.
					});
				return () => { ac.abort(); };
			}, "gateway-whoami: fetch");

			const styleId = "docker-dsh-whoami-foot";
			ctx.effect(() => {
				if (document.getElementById(styleId) === null) {
					const tag = document.createElement("style");
					tag.id = styleId;
					tag.textContent = '[class*="footArea"]{flex-direction:column-reverse;}';
					document.head.appendChild(tag);
				}
				return () => {
					const tag = document.getElementById(styleId);
					if (tag) tag.remove();
				};
			}, "gateway-whoami: foot order");

			ctx.slots.inject("sidebar.footer.action", () => ctx.slots.register({
				name: "sidebar.footer.action",
				id: "gateway-whoami",
				order: -100,
				inject: () => ({ hooks: { username } }),
			}, WhoamiLabel));
		}

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
