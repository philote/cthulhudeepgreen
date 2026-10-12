const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class ExposurePanel extends HandlebarsApplicationMixin(ApplicationV2) {

    /** @override */
    static DEFAULT_OPTIONS = {
        id: "exposure-panel",
        window: { frame: false, positioned: false },
        actions: {
            changeExposure: { handler: ExposurePanel.#onChangeExposure, buttons: [0, 2] },
            clearExposure: ExposurePanel.#onClearExposure,
        },
    };

    /** @override */
    static PARTS = {
        panel: { template: "systems/cthulhudeepgreen/templates/panel/exposure-panel.hbs" },
    };

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        const savedCurrentExposure = game.settings.get("cthulhudeepgreen", "current-exposure");

        return {
            ...context,
            currentExposure: savedCurrentExposure,
            exposureTitle: game.i18n.localize("CDG.dialog.exposure.title"),
            max: CONFIG.CDG.ExposureMax,
            spokes: Array(CONFIG.CDG.ExposureMax).keys(),
            isGM: game.user.isGM
        };
    }

    /**
     * Left-click increases Exposure, right-click decreases it.
     * @this {ExposurePanel}
     */
    static #onChangeExposure(event) {
        if (!game.user.isGM) return;
        if (event.button === 2) this._onExposureDecrease();
        else this._createExposureChatMessage();
    }

    /** @this {ExposurePanel} */
    static #onClearExposure() {
        if (!game.user.isGM) return;
        game.settings.set("cthulhudeepgreen", "current-exposure", 0);
    }

    _onExposureDecrease() {
        let exposure = game.settings.get("cthulhudeepgreen", "current-exposure");
        exposure = Math.max(exposure - 1, 0);
        game.settings.set("cthulhudeepgreen", "current-exposure", exposure);
    }

    async _createExposureChatMessage() {
        const oldExposure = game.settings.get("cthulhudeepgreen", "current-exposure");
        if (oldExposure >= CONFIG.CDG.ExposureMax) return;
        const newExposure = oldExposure + 1;

        const increaseMessage = game.i18n.format("CDG.chat.exposureIncrease.increaseMessage", {
          oldExposure: oldExposure,
          newExposure: newExposure
        });

        const dialogData = {
            increaseMessage: increaseMessage
        };

        const template = 'systems/cthulhudeepgreen/templates/msg/exposure-increased-chat-msg.hbs';
        const rendered_html = await foundry.applications.handlebars.renderTemplate(template, dialogData);

        ChatMessage.create({
            content: rendered_html,
            flags: { cthulhudeepgreen: { data: {
              css: "chat-message-exposure",
              exposureUpdate: true,
              exposure: newExposure
            },
            chatID: "cthulhudeepgreen"
            }}
        });
    }
}
