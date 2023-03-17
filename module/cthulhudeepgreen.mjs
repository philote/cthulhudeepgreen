// Import document classes.
import { CthulhuDeepGreenActor } from "./documents/actor.mjs";
import { CthulhuDeepGreenItem } from "./documents/item.mjs";
// Import sheet classes.
import { CthulhuDeepGreenActorSheet } from "./sheets/actor-sheet.mjs";
import { CthulhuDeepGreenItemSheet } from "./sheets/item-sheet.mjs";
// Import helper/utility classes and constants.
import { CDG } from "./helpers/config.mjs";

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', async function() {

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
  Actors.registerSheet("cthulhudeepgreen", CthulhuDeepGreenActorSheet, { makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("cthulhudeepgreen", CthulhuDeepGreenItemSheet, { makeDefault: true });
});

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

// If you need to add Handlebars helpers, here are a few useful examples:
Handlebars.registerHelper('concat', function() {
  var outStr = '';
  for (var arg in arguments) {
    if (typeof arguments[arg] != 'object') {
      outStr += arguments[arg];
    }
  }
  return outStr;
});

Handlebars.registerHelper('toLowerCase', function(str) {
  return str.toLowerCase();
});
