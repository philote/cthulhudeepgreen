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

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

// Multiboxes from Blades in the Dark system module.
// https://github.com/megastruktur/foundryvtt-blades-in-the-dark
Handlebars.registerHelper("multiboxes", function (selected, options) {
  let html = options.fn(this);

  // Fix for single non-array values.
  if (!Array.isArray(selected)) {
    selected = [selected];
  }

  if (typeof selected !== "undefined") {
    selected.forEach((selected_value) => {
      if (selected_value !== false) {
        let escapedValue = RegExp.escape(
          Handlebars.escapeExpression(selected_value)
        );
        let rgx = new RegExp(' value="' + escapedValue + '"');
        let oldHtml = html;
        html = html.replace(rgx, "$& checked");
        while (oldHtml === html && escapedValue >= 0) {
          escapedValue--;
          rgx = new RegExp(' value="' + escapedValue + '"');
          html = html.replace(rgx, "$& checked");
        }
      }
    });
  }
  return html;
});

// "N Times" loop for handlebars.
//  Block is executed N times starting from n=1.
//
// Usage:
// {{#times_from_1 10}}
//   <span>{{this}}</span>
// {{/times_from_1}}
Handlebars.registerHelper("times_from_1", function (n, block) {
  var accum = "";
  for (var i = 1; i <= n; ++i) {
    accum += block.fn(i);
  }
  return accum;
});

// "N Times" loop for handlebars.
//  Block is executed N times starting from n=0.
//
// Usage:
// {{#times_from_0 10}}
//   <span>{{this}}</span>
// {{/times_from_0}}
Handlebars.registerHelper("times_from_0", function (n, block) {
  var accum = "";
  for (var i = 0; i <= n; ++i) {
    accum += block.fn(i);
  }
  return accum;
});
