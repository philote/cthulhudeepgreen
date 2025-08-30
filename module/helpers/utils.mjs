/**
 * Register custom Handlebars helpers.
 */
export function registerHandlebarsHelpers() {
	/**
	 * Repeats a given block N-times.
	 * @param {number} n	The number of times the block is repeated.
	 * @param {object} options	Helper options
	 * @param {number} [options.start]	The starting index number.
	 * @param {boolean} [options.reverse] Invert the index number.
	 * @returns {string}
	 */
	Handlebars.registerHelper("times", function (n, options) {
		let accum = "";
		let data;
		if (options.data) {
			data = Handlebars.createFrame(options.data);
		}
		let { start = 0, reverse = false } = options.hash;
		for (let i = 0; i < n; ++i) {
			if (data) {
				data.index = reverse ? n - i - 1 + start : i + start;
				data.first = i === 0;
				data.last = i === n - 1;
			}
			accum += options.fn(i, { data: data });
		}
		return accum;
	});

	// Checks whether a game setting is active
	Handlebars.registerHelper("getSetting", function (arg) {
		if (arg == "" || arg == "non" || arg == undefined) {
			return;
		}
		return game.settings.get("cthulhudeepgreen", arg);
	});
}

export const registerSettings = function () {
	game.settings.register("cthulhudeepgreen", "show_special", {
		name: "CDG.settings.special.name",
		hint: "CDG.settings.special.hint",
		scope: "world",
		config: true,
		type: Boolean,
		default: false,
		onChange: (_) => window.location.reload(),
	});

	game.settings.register("cthulhudeepgreen", "show_exposure", {
		name: "CDG.settings.exposure.name",
		hint: "CDG.settings.exposure.hint",
		scope: "world",
		config: true,
		type: Boolean,
		default: false,
		onChange: (_) => window.location.reload(),
	});

	game.settings.register("cthulhudeepgreen", "current-exposure", {
		name: "current-exposure",
		scope: "world",
		type: Number,
		default: 0,
		config: false,
		onChange: (_) => ui.exposurePanel.render(true),
	});
};
