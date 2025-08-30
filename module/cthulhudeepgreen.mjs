// Import document classes.
import { CthulhuDeepGreenActor } from "./documents/actor.mjs";
import { CthulhuDeepGreenItem } from "./documents/item.mjs";
// Import sheet classes.
import { CthulhuDeepGreenActorSheet } from "./sheets/actor-sheet.mjs";
import { CthulhuDeepGreenItemSheet } from "./sheets/item-sheet.mjs";
// Import helper/utility classes and constants.
import { CDG } from "./helpers/config.mjs";
import * as utils from "./helpers/utils.mjs";
import { ExposurePanel } from "./helpers/exposure-panel.mjs";

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once("init", async function () {
  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.cthulhudeepgreen = {
    CthulhuDeepGreenActor,
    CthulhuDeepGreenItem
  };

  // Add custom constants for configuration.
  CONFIG.CDG = CDG;

  // Define custom Document classes
  CONFIG.Actor.documentClass = CthulhuDeepGreenActor;
  CONFIG.Item.documentClass = CthulhuDeepGreenItem;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("cthulhudeepgreen", CthulhuDeepGreenActorSheet, {
    makeDefault: true,
  });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("cthulhudeepgreen", CthulhuDeepGreenItemSheet, {
    makeDefault: true,
  });

  // Register system settings
  utils.registerSettings();
  utils.registerHandlebarsHelpers();
});

Hooks.once("ready", () => {
  // Exposure
  ui.exposurePanel = new ExposurePanel();

  Hooks.on('renderChatMessage', (chatMessage, [html], messageData) => {
    const data = chatMessage.getFlag('cthulhudeepgreen', 'data');
    if (data == undefined) return;
    const cssFlag = data.css;
    if (cssFlag) {
      $(html).addClass(cssFlag);
    }

    if (!game.user.isGM) return;

    const exposureUpdate = data.exposureUpdate;
    const exposure = data.exposure;
    if (exposureUpdate && (exposure >= 0 && exposure <= 10)) {
      game.settings.set("cthulhudeepgreen", "current-exposure", exposure);
    }
  });
});

Hooks.on("ready", () => {
  if (game.settings.get("cthulhudeepgreen", "show_exposure")) {
    ui.exposurePanel.render(true);
  }
});

Hooks.on('renderChatMessage', (chatMessage, [html], messageData) => {
  const flag = chatMessage.getFlag('cthulhudeepgreen', 'chatID');
  if (flag && flag == "cthulhudeepgreen") {
    $(html).addClass("roll-chat");
  }
});

Hooks.on("renderSettings", (app, html) => {
	// --- Setting Module Configuration
	const MODULE_CONFIG = {
		headingKey: "CDG.Settings.game.heading",
		sectionClass: "us2e-doc",
		buttonsData: [
			{
				action: (ev) => {
					ev.preventDefault();
					window.open(
						"https://moth-lands.itch.io/cthulhu-deep-green",
						"_blank"
					);
				},
				iconClasses: ["fa-solid", "fa-book"],
				labelKey: "CDG.Settings.game.publisher.title",
			},
			{
				action: (ev) => {
					ev.preventDefault();
					window.open("https://github.com/philote/cthulhudeepgreen", "_blank");
				},
				iconClasses: ["fab", "fa-github"],
				labelKey: "CDG.Settings.game.github.title",
			},
			{
				action: (ev) => {
					ev.preventDefault();
					window.open("https://ko-fi.com/ephson", "_blank");
				},
				iconClasses: ["fa-solid", "fa-mug-hot"],
				labelKey: "CDG.Settings.game.kofi.title",
			},
		],
	};

	// --- Button Creation Logic
	const buttons = MODULE_CONFIG.buttonsData.map(
		({ action, iconClasses, labelKey }) => {
			const button = document.createElement("button");
			button.type = "button";

			const icon = document.createElement("i");
			icon.classList.add(...iconClasses);

			// Append icon and localized text node
			button.append(
				icon,
				document.createTextNode(` ${game.i18n.localize(labelKey)}`)
			);

			button.addEventListener("click", action);
			return button;
		}
	);

	// --- Version Specific Logic (Reusable) ---
	if (game.release.generation >= 13) {
		// V13+ Logic: Insert after the "Documentation" section
		const documentationSection = html.querySelector("section.documentation");
		if (documentationSection) {
			// Create section wrapper
			const section = document.createElement("section");
			section.classList.add(MODULE_CONFIG.sectionClass, "flexcol");

			const divider = document.createElement("h4");
			divider.classList.add("divider");
			divider.textContent = game.i18n.localize(MODULE_CONFIG.headingKey);

			// Append divider and buttons to section
			section.append(divider, ...buttons);

			// Insert section before documentation
			documentationSection.before(section);
		} else {
			console.warn(
				`${game.i18n.localize(
					MODULE_CONFIG.headingKey
				)} | Could not find 'section.documentation' in V13 settings panel.`
			);
		}
	} else {
		// V12 Logic: Insert after the "Game Settings" section
		const gameSettingsSection = html[0].querySelector("#settings-game");
		if (gameSettingsSection) {
			const header = document.createElement("h2");
			header.innerText = game.i18n.localize(MODULE_CONFIG.headingKey);

			const settingsDiv = document.createElement("div");
			settingsDiv.append(...buttons);

			// Insert the header and the div containing buttons after the game settings section
			gameSettingsSection.after(header, settingsDiv);
		} else {
			console.warn(
				`${game.i18n.localize(
					MODULE_CONFIG.headingKey
				)} | Could not find '#settings-game' section in V12 settings panel.`
			);
		}
	}
});
