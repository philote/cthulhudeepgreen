export class ExposurePanel extends Application {

    constructor(options) {
        super(options);
    }

    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            id: "exposure-panel",
            popOut: false,
            template: "systems/cthulhudeepgreen/templates/panel/exposure-panel.hbs",
        };
    }

    /** @override */
    getData(options) {
        const data = super.getData(options);
        const savedCurrentExposure = game.settings.get("cthulhudeepgreen", "current-exposure");

        return {
            ...data,
            currentExposure: savedCurrentExposure,
            exposureTitle: game.i18n.localize("CDG.dialog.exposure.title"), // TODO
            max: 10,
            spokes: Array(10).keys(),
            isGM: game.user.isGM
        };
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        html.find('.on-click').click(this._onExposureIncrease.bind(this));
        html.find('.on-click').contextmenu(this._onExposureDecrease.bind(this));
        html.find('.on-click-clear').click(this._onClearHeat.bind(this));
    }

    async _onExposureIncrease(event) {
        event.preventDefault();
        this._createExposureChatMessage();
    }

    _onExposureDecrease(event) {
        event.preventDefault();
        let exposure = game.settings.get("cthulhudeepgreen", "current-exposure");
        exposure = Math.max(exposure - 1, 0);
        game.settings.set("cthulhudeepgreen", "current-exposure", exposure);
    }


    _onClearExposure(event) {
        event.preventDefault();
        game.settings.set("cthulhudeepgreen", "current-exposure", 0);
    }

    async _createExposureChatMessage() {
        const oldExposure = game.settings.get("cthulhudeepgreen", "current-exposure");
        const newExposure = oldExposure + 1;
      
        const increaseMessage = game.i18n.format("CDG.chat.exposureIncrease.increaseMessage", {
          oldExposure: oldExposure,
          newExposure: newExposure
        });
      
        const dialogData = {
            increaseMessage: increaseMessage
        };
        
        const template = 'systems/cthulhudeepgreen/templates/msg/exposure-increased-chat-msg.hbs';
        const rendered_html = await renderTemplate(template, dialogData);
      
        ChatMessage.create({
            content: rendered_html,
            flags: { cthulhudeepgreen: { data: {
              css: "chat-message-exposure",
              exposureUpdate: true,
              exposure: newExposure
            } } }
        });                 
    }
}