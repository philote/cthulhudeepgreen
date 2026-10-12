const { HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Extend the basic ItemSheetV2 with some very simple modifications
 * @extends {ItemSheetV2}
 */
export class CthulhuDeepGreenItemSheet extends HandlebarsApplicationMixin(foundry.applications.sheets.ItemSheetV2) {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["cthulhudeepgreen", "sheet", "item"],
    position: { width: 310, height: 620 },
    window: { resizable: true },
    form: { submitOnChange: true },
  };

  /** @override */
  static PARTS = {
    sheet: { template: "systems/cthulhudeepgreen/templates/item/item-sheet.hbs" },
  };

  /* -------------------------------------------- */

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    // Add the item's data to context for easier access, as well as flags.
    context.item = this.item;
    context.system = this.item.system;
    context.flags = this.item.flags;

    // Enriched description for the ProseMirror editor.
    context.enrichedDescription = await foundry.applications.ux.TextEditor.implementation.enrichHTML(this.item.system.description, {
      secrets: this.item.isOwner,
      rollData: this.item.getRollData() ?? {},
      relativeTo: this.item,
    });

    return context;
  }

  /** @inheritDoc */
  async _onRender(context, options) {
    await super._onRender(context, options);
    // Mark sheets the user can view but not edit, so their fields can be dimmed
    this.element.classList.toggle("read-only", !this.isEditable);
  }
}
