/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class CthulhuDeepGreenActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["cthulhudeepgreen", "sheet", "actor"],
      template: "systems/cthulhudeepgreen/templates/actor/actor-sheet.html",
      width: 650,
      height: 665,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "main" }]
    });
  }

  /** @override */
  get template() {
    return `systems/cthulhudeepgreen/templates/actor/actor-${this.actor.type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = this.actor.toObject(false);

    // Add the actor's data to context.data for easier access, as well as flags.
    context.system = actorData.system;
    context.flags = actorData.flags;

    // Prepare character data and items.
    if (actorData.type == 'character') {
      this._prepareCharacterData(context);
    }

    // Prepare NPC data and items.
    // if (actorData.type == 'npc') {}

    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    return context;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterData(context) {
    
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Rollable.
    html.find('.rollable').click(this._onRoll.bind(this));
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    // Handle rolls.
    if (dataset.rollType) {
      switch (dataset.rollType) {
        case 'selfcare': 
        case 'failure': {
          this.simpleRoll(dataset.rollType);
          return;
        }
        case 'darkdie': {
          // TODO Dialog to ask if you risk stress, insight or both
        }
        case 'riskything':
        default: { 
          // TODO Dialog
          return;
        }
      }
    }

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      let label = dataset.label ? `[ability] ${dataset.label}` : '';
      let roll = new Roll(dataset.roll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }
  }

  // ----------------------
  // Dice rolling functions
  // ----------------------
  
  getDiceForOutput(dieNumber, colorHex) {
    switch (dieNumber) {
        case "1":
            return `<i class="fas fa-dice-one" style="color:${colorHex}; font-size: 2em;"></i>`;
        case "2":
            return `<i class="fas fa-dice-two" style="color:${colorHex}; font-size: 2em;"></i>`;
        case "3":
            return `<i class="fas fa-dice-three" style="color:${colorHex}; font-size: 2em;"></i>`;
        case "4":
            return `<i class="fas fa-dice-four" style="color:${colorHex}; font-size: 2em;"></i>`;
        case "5":
            return `<i class="fas fa-dice-five" style="color:${colorHex}; font-size: 2em;"></i>`;
        case "6":
            return `<i class="fas fa-dice-six" style="color:${colorHex}; font-size: 2em;"></i>`;
        default:
            console.error("Error in the getDiceForOutput, bad die number used.");
    }
  }

  getWordInsightWithFormatting() {
    return `<b style="color: ${CONFIG.CDG.InsightColor}"><i>${game.i18n.localize("CDG.Insight")}</i></b>`;
  }

  getWordStressWithFormatting() {
    return `<b style="color: ${CONFIG.CDG.StressColor}"><i>${game.i18n.localize("CDG.Stress")}</i></b>`;
  }
  
  // ------------
  // Simple Rolls
  // ------------

  failureChatContent(diceOutput) {
    return `
        <p>
          <span style="font-size: 1.5em;">
            ${game.i18n.localize('CDG.FailureRoll')} 
          </span> 
          ${diceOutput}
        </p>
        <hr>
        ${game.i18n.localize('CDG.FailureRollContent')}
    `;
  }

  selfCareChatContent(diceNumber) {
    let previousStress = duplicate(this.actor.system.stress.value);
    const rollValue = +diceNumber;
    let newStress = previousStress - rollValue;
    newStress = newStress < 0 ? 0 : newStress;

    // update Stress
    this.actor.system.stress.value = newStress;
    this.actor.update({"system.stress.value": newStress});

    let selfCareMessage = `<p><span style="font-size: 1.5em;">${game.i18n.localize('CDG.SelfCareRoll')} </span>${this.getDiceForOutput(diceNumber, CONFIG.CDG.BaseColor)}</p><hr>`;
    return selfCareMessage.concat(game.i18n.format('CDG.SelfCareRollContent', {stress1: this.getWordStressWithFormatting(), previousstress: previousStress, newstress: newStress, stress2: this.getWordStressWithFormatting()}));
  }

  async simpleRoll(rollType) {
    let simpleRoll = await new Roll('1d6').evaluate({ async: true });
    let chatContentMessage = "";

    switch (rollType) {
      case 'selfcare': {
        chatContentMessage = this.selfCareChatContent(simpleRoll.result);
        break;
      }
      case 'failure': {
        chatContentMessage = this.failureChatContent(this.getDiceForOutput(simpleRoll.result, CONFIG.CDG.BaseColor));
        break;
      }
      default: { 
        console.error("Error in the simpleRoll, bad die rollType used.");
        return;
      }
    }

    const user = game.user.id;
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get('core', 'rollMode');

    ChatMessage.create({
      user: user,
      speaker: speaker,
      rollMode: rollMode,
      content: chatContentMessage
    });
  }

}
