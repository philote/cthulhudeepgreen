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
      height: 650,
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
          const title = game.i18n.localize("CDG.DarkDieDialogTitle");
          const content = this.darkDieDialogContent(title);
          return;
        }
        case 'riskything': {
          const title = game.i18n.localize("CDG.RiskyDialogTitle");
          const content = this.riskyDialogContent();
          this.asyncCDGRiskyThingDialog({title, content});
          return;
        }
        default: {
          console.error("_onRoll, bad roll type.");
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

  getWordDarkDieWithFormatting() {
    return `<b style="color: ${CONFIG.CDG.DarkDieColor}"><i>${game.i18n.localize("CDG.DarkDie")}</i></b>`;
  }

  getWordStressWithFormatting() {
    return `<b style="color: ${CONFIG.CDG.StressColor}"><i>${game.i18n.localize("CDG.Stress")}</i></b>`;
  }

  getWordDarkDieRollWithFormatting() {
    return `<b style="color: ${CONFIG.CDG.DarkDieColor}"><i>${game.i18n.localize("CDG.DarkDieDialogRoll")}</i></b>`;
  }

  // ------------
  // Dialog Rolls
  // ------------

  // TODO Needs updated
  darkDieDialogContent(dialogTitle) {
    return `
            <p><b>${dialogTitle}</b></p>
            <form class="flexcol">
              <div class="form-group">
                <input style="align-self: flex-start;" type="checkbox" id="stress" name="stress">
                <label for="stress">${game.i18n.format('CDG.DialogRiskDieInsight', { insight: this.getWordInsightWithFormatting() })}</label>
              </div>
              <div class="form-group">
                <input style="align-self: flex-start;" type="checkbox" id="insight" name="insight">
                <label for="insight">${game.i18n.format('CDG.DialogRiskDieInsight', { insight: this.getWordInsightWithFormatting() })}</label>
              </div>
            </form>
            </br>
        `;
  }

  riskyDialogContent() {
    return `
            <p><b>${game.i18n.localize("CDG.RiskyDialogDesc")}</b></p>
            <hr>
            <form class="flexcol">
                <div class="form-group">
                    <input style="align-self: flex-start;" type="checkbox" id="humanDie" name="humanDie">
                    <label for="humanDie"><i class="fa-solid fa-dice-five"></i>&#8194;${game.i18n.localize("CDG.DialogHumanDie")}</label>
                </div>
                <div class="form-group">
                    <input style="align-self: flex-start;" type="checkbox" id="occupationalDie" name="occupationalDie">
                    <label for="occupationalDie"><i class="fa-solid fa-dice-five"></i>&#8194;${game.i18n.localize("CDG.DialogOccupDie")}</label>
                </div>
                <div class="form-group">
                    <input style="align-self: flex-start;" type="checkbox" id="darkDie" name="darkDie">
                    <label for="darkDie"><i style="color: ${CONFIG.CDG.DarkDieColor}" class="fa-solid fa-dice-five"></i>&#8194;${game.i18n.format('CDG.DialogRiskDie', { darkdie: this.getWordDarkDieWithFormatting() })}</label>
                </div>
                <div class="form-group" style="margin-left: 30px">
                  <input style="align-self: flex-start;" type="checkbox" id="insight" name="insight">
                  <label for="insight">${game.i18n.format('CDG.DialogRiskDieInsight', { insight: this.getWordInsightWithFormatting() })}</label>
                </div>
            </form>
            </br>
        `;
  }
  
  getRiskMoveMessage() {
    return `
        <hr>
        <div style="font-size: 18px">
          <b>${game.i18n.format('CDG.RiskMoveMessage', { darkdieroll: this.getWordDarkDieRollWithFormatting() })}</b>
        <div>
    `;
  }

  getMaxDieMessage(maxDieNumber) {
    switch (maxDieNumber) {
      case "1":
      case "2":
      case "3":
          return game.i18n.localize("CDG.MaxDieMessage123");
      case "4":
          return game.i18n.localize("CDG.MaxDieMessage4");
      case "5":
          return game.i18n.localize("CDG.MaxDieMessage5");
      case "6":
          return game.i18n.localize("CDG.MaxDieMessage6");
      default: {
          console.error("ERROR(getMaxDieMessage)");
          return;
      }
    }
  }

  chatContent(diceOutput, maxDieNumber, riskMessage) {
    return `
        <p>
          <b style="font-size: 1.5em;">${game.i18n.localize("CDG.RiskyDialogTitle")}: </b>
          ${diceOutput}
        </p>
        <hr>
        <p>${this.getMaxDieMessage(maxDieNumber)}</p>
        ${riskMessage}
    `;
  }

  darkDieChatContent(diceNumber, effectsInsight) {
    const previousStress = duplicate(this.actor.system.stress.value);
    const previousInsight = duplicate(this.actor.system.insight.value);
    const rollValue = +diceNumber;
    let newStress = previousStress;
    let newInsight = previousInsight;

    let darkDieMessage = "";

    if ((rollValue > previousStress) || (effectsInsight && rollValue > previousInsight)) {
      darkDieMessage = "<hr>";
    }

    if (rollValue > previousStress) {
      // update Stress
      ++newStress;
      this.actor.system.stress.value = newStress;
      this.actor.update({"system.stress.value": newStress});
      darkDieMessage = darkDieMessage.concat(game.i18n.format('CDG.StressContent', {stress: this.getWordStressWithFormatting(), previousstress: previousStress, newstress: newStress}));
    }

    if (effectsInsight && rollValue > previousInsight) {
      if (rollValue > previousStress) {
        darkDieMessage = darkDieMessage.concat("<br>");
      }
      // update Inisght
      ++newInsight;
      this.actor.system.insight.value = newInsight;
      this.actor.update({"system.insight.value": newInsight});
      darkDieMessage = darkDieMessage.concat(game.i18n.format('CDG.InsightContent', {insight: this.getWordInsightWithFormatting(), previousinsight: previousInsight, newinsight: newInsight}));
    }

    return darkDieMessage;
  }

  async asyncCDGRiskyThingDialog({
    title = "",
    content = ""
  } = {}) {
    return await new Promise(async (resolve) => {
        new Dialog({
            title: title,
            content: content,
            buttons: {
                button1: {
                    icon: '<i class="fa-solid fa-dice"></i>',
                    label: "Roll!",
                    callback: async (html) => {
                        
                        // get and roll selected dice
                        const dice = [];
                        if (document.getElementById("humanDie").checked) {
                            let hdRoll = await new Roll('1d6').evaluate({ async: true });
                            dice.push({
                                dieColor: CONFIG.CDG.BaseColor,
                                isRisk: false,
                                rollVal: hdRoll.result
                            });
                        };

                        if (document.getElementById("occupationalDie").checked) {
                            let odRoll = await new Roll('1d6').evaluate({ async: true });
                            dice.push({
                                dieColor: CONFIG.CDG.BaseColor,
                                isRisk: false,
                                rollVal: odRoll.result
                            });
                        };

                        if (document.getElementById("darkDie").checked) {
                            let idRoll = await new Roll('1d6').evaluate({ async: true });
                            dice.push({
                                dieColor: CONFIG.CDG.DarkDieColor,
                                isRisk: true,
                                rollVal: idRoll.result
                            });
                        };
                        
                        const darkDieEffectsInsight = document.getElementById("insight").checked && document.getElementById("darkDie").checked;
                        // console.error("darkDieEffectsInsight: "+darkDieEffectsInsight);
                        
                        const maxDie = dice.reduce((a, b) => (a.rollVal > b.rollVal) ? a : b);

                        // Determine if the risk die won
                        let isRiskDie = false;
                        dice.every(die => {
                          if ((die.rollVal == maxDie.rollVal) && die.isRisk) {
                            isRiskDie = true;
                            return false;
                          }
                          return true;
                        });

                        console.log("isRiskDie: "+isRiskDie);

                        let riskMessage = "";
                        if (isRiskDie) {
                            riskMessage = this.darkDieChatContent(maxDie.rollVal, darkDieEffectsInsight);
                            console.log("riskMessage: "+riskMessage);
                        }

                        // Build Dice list
                        let diceOutput = "";
                        dice.forEach(die => {
                            diceOutput = diceOutput.concat(this.getDiceForOutput(die.rollVal, die.dieColor), " ");
                        });

                        // Initialize chat data.
                        const chatContentMessage = this.chatContent(diceOutput, maxDie.rollVal, riskMessage);
                        const user = game.user.id;
                        const speaker = ChatMessage.getSpeaker({ actor: this.actor });
                        const rollMode = game.settings.get('core', 'rollMode');

                        ChatMessage.create({
                          user: user,
                          speaker: speaker,
                          rollMode: rollMode,
                          content: chatContentMessage
                        });

                        // ----
                        resolve(null);
                    }
                }
            },
            close: () => {
                resolve(null);
            }
        }).render(true);
    });
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
