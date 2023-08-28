// Import document classes.
import { CthulhuDeepGreenActor } from "./documents/actor.mjs";
import { CthulhuDeepGreenItem } from "./documents/item.mjs";
// Import sheet classes.
import { CthulhuDeepGreenActorSheet } from "./sheets/actor-sheet.mjs";
import { CthulhuDeepGreenItemSheet } from "./sheets/item-sheet.mjs";
// Import helper/utility classes and constants.
import { CDG } from "./helpers/config.mjs";
import { ExposurePanel } from "./helpers/exposure-panel.mjs";
import { registerSettings } from "./helpers/settings.mjs";

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once("init", async function () {
  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.cthulhudeepgreen = {
    CthulhuDeepGreenActor,
    CthulhuDeepGreenItem,
    registerSettings
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
  registerSettings();
});

Hooks.once("ready", () => {
  // Heat
  ui.exposurePanel = new ExposurePanel();
  ui.exposurePanel.render(true);

  Hooks.on('renderChatMessage', (chatMessage, html, messageData) => {
    const data = chatMessage.getFlag('cthulhudeepgreen', 'data');
    if (data == undefined) return;
    const cssFlag = data.css;
    if (cssFlag) {
      html.addClass(cssFlag);
    }

    if (!game.user.isGM) return; 
    // TODO create an error for no GM, so Heat did not update?

    const exposureUpdate = data.exposureUpdate;
    const exposure = data.exposure;
    if (exposureUpdate && (exposure >= 0 && exposure <= 10)) {
      game.settings.set("cthulhudeepgreen", "current-exposure", exposure);
    }
  });
});

Hooks.on('renderChatMessage', (chatMessage, [html], messageData) => {
  const flag = chatMessage.getFlag('cthulhudeepgreen', 'chatID');
  if (flag && flag == "cthulhudeepgreen") {
    $(html).addClass("roll-chat");
  }
});
// flags: { cthulhudeepgreen: { chatID: "cthulhudeepgreen" }}

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

// Checks whether a game setting is active
Handlebars.registerHelper("getSetting", function(arg){
  if (arg == "" || arg == "non" || arg == undefined) { return ; }
  return game.settings.get('cthulhudeepgreen', arg);
});
