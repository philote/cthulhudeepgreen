/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class CthulhuDeepGreenActorSheet extends ActorSheet {
  constructor(...args) {
    super(...args);

    let width = 670;
    let height = 650;
    if (this.actor.type == "npc") {
      width = 310;
      height = 780;
    }
    this.position.width = width;
    this.position.height = height;
  }

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["cthulhudeepgreen", "sheet", "actor"],
      tabs: [{
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "main",
      }]
    });
  }

  /** @override */
  get template() {
    return `systems/cthulhudeepgreen/templates/actor/actor-${this.actor.type}-sheet.hbs`;
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

    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    return context;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Rollable.
    html.find(".rollable").click(this._onRoll.bind(this));
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async _onRoll(event) {
    event.preventDefault();
    const dataset = event.currentTarget.dataset;

    // Handle rolls.
    if (dataset.rollType) {
      switch (dataset.rollType) {
        case "selfcare":
        case "failure": {
          this.simpleRoll(dataset.rollType);
          return;
        }
        case "darkdie": {
          this.asyncCDGDarkDieRollDialog();
          return;
        }
        case "riskything": {
          this.asyncCDGRiskyThingDialog();
          return;
        }
        case "clearharm": {
          this.clearHarm();
          return;
        }
        case "toggle-insight": {
          this._onToggleInsight(dataset.pos);
          return;
        }
        case "toggle-stress": {
          this._onToggleStress(dataset.pos);
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
      let label = dataset.label ? `[ability] ${dataset.label}` : "";
      let roll = new Roll(dataset.roll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get("core", "rollMode"),
      });
      return roll;
    }
  }

  clearHarm() {
    this.actor.system.harm.injury.name = "";
    this.actor.update({ "system.harm.injury.name": "" });

    this.actor.system.harm.debility.name = "";
    this.actor.update({ "system.harm.debility.name": "" });

    this.actor.system.harm.mortal_wound.name = "";
    this.actor.update({ "system.harm.mortal_wound.name": "" });
  }

  // Insight
  _onToggleInsight(pos) {
    let currentArray = this.actor.system.insight.states;
    let currentState = currentArray[pos];
    let newState = 0;

    if (currentState === false) {
      newState = true;
    } else {
      newState = false;
    }

    currentArray[pos] = newState;
    this.actor.update({ ["system.insight.states"]: currentArray });
  }

  // _onClearInsight() {
  //   let currentArray = this.actor.system.insight.states;
  //   for (const i in currentArray) {
  //     if (currentArray[i] === true) {
  //       currentArray[i] = false;
  //     }
  //   }

  //   this.actor.update({ ["system.insight.states"]: currentArray });
  // }

  // _increaseInsightByOne() {
  //   let newInsight = duplicate(this.actor.system.insight.value);

  //   if (newInsight < 6) {
  //     let currentArray = this.actor.system.insight.states;
  //     const firstPos = currentArray.indexOf(false);
  //     if (firstPos != -1) {
  //       currentArray[firstPos] = true;
  //       this.actor.update({ ["system.insight.states"]: currentArray });
  //     }
  //   }

  //   this.actor.update({ "system.insight.value": newInsight });
  // }

  // Stress
  _onToggleStress(pos) {
    let currentArray = this.actor.system.stress.states;
    let currentState = currentArray[pos];
    let newState = 0;

    if (currentState === false) {
      newState = true;
    } else {
      newState = false;
    }

    currentArray[pos] = newState;
    this.actor.update({ ["system.stress.states"]: currentArray });
  }

  _reduceStressBy(reduction = 0) {
    if (reduction <= 0) {return;}

    let currentArray = this.actor.system.stress.states;
    let reduced = reduction;
    for (const i in currentArray) {
      if (currentArray[i] === true) {
        currentArray[i] = false;
        --reduced;
      }
      if (reduced === 0) {break;}
    }

    this.actor.update({ ["system.stress.states"]: currentArray });
  }

  // ----------------------
  // Dice rolling functions
  // ----------------------

  getDiceForOutput(dieNumber, colorHex) {
    switch (dieNumber) {
      case 1:
      case "1":
        return `<i class="fas fa-dice-one" style="color:${colorHex}; font-size: 2em;"></i>`;
      case 2:
      case "2":
        return `<i class="fas fa-dice-two" style="color:${colorHex}; font-size: 2em;"></i>`;
      case 3:
      case "3":
        return `<i class="fas fa-dice-three" style="color:${colorHex}; font-size: 2em;"></i>`;
      case 4:
      case "4":
        return `<i class="fas fa-dice-four" style="color:${colorHex}; font-size: 2em;"></i>`;
      case 5:
      case "5":
        return `<i class="fas fa-dice-five" style="color:${colorHex}; font-size: 2em;"></i>`;
      case 6:
      case "6":
        return `<i class="fas fa-dice-six" style="color:${colorHex}; font-size: 2em;"></i>`;
      default:
        console.error("Error in the getDiceForOutput, bad die number used.");
    }
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

  darkDieChatContent(diceNumber, effectsInsight, effectsStress) {
    const previousStress = duplicate(this.actor.system.stress.value);
    const previousInsight = duplicate(this.actor.system.insight.value);
    const rollValue = +diceNumber;
    let newStress = previousStress;
    let newInsight = previousInsight;

    let darkDieMessage = "";

    if (
      (effectsStress && rollValue > previousStress) ||
      (effectsInsight && rollValue > previousInsight)
    ) {
      darkDieMessage = "<hr>";
    }

    if (effectsStress && rollValue > previousStress) {
      // update Stress
      ++newStress;
      this.actor.system.stress.value = newStress;
      this.actor.update({ "system.stress.value": newStress });
      darkDieMessage = darkDieMessage.concat(
        game.i18n.format("CDG.StressContent", {
          previousstress: previousStress,
          newstress: newStress,
        })
      );
    }

    if (effectsInsight && rollValue > previousInsight) {
      if (effectsStress && rollValue > previousStress) {
        darkDieMessage = darkDieMessage.concat("<br>");
      }
      // update Insight
      ++newInsight;
      this.actor.system.insight.value = newInsight;
      this.actor.update({ "system.insight.value": newInsight });
      darkDieMessage = darkDieMessage.concat(
        game.i18n.format("CDG.InsightContent", {
          previousinsight: previousInsight,
          newinsight: newInsight,
        })
      );
    }

    return darkDieMessage;
  }

  // -------------
  // Dark Die Roll
  // -------------

  async asyncCDGDarkDieRollDialog() {
    return await new Promise(async (resolve) => {
      new Dialog({
          title: game.i18n.localize("CDG.DarkDieDialogTitle"),
          content: await renderTemplate('systems/cthulhudeepgreen/templates/dialog/dark-die.hbs'),
          buttons: {
            button1: {
              icon: '<i class="fa-solid fa-dice"></i>',
              label: game.i18n.localize("CDG.ActionRoll"),
              callback: async (html) => {
                const darkDieEffectsInsight =
                  document.getElementById("insight").checked;
                const darkDieEffectsStress =
                  document.getElementById("stress").checked;

                if (!darkDieEffectsInsight && !darkDieEffectsStress) {return;}

                const darkDieRoll = await new Roll("1d6").evaluate({
                  async: true,
                });
                let riskMessage = this.darkDieChatContent(
                  darkDieRoll.result,
                  darkDieEffectsInsight,
                  darkDieEffectsStress
                );
                let diceOutput = this.getDiceForOutput(
                  darkDieRoll.result,
                  CONFIG.CDG.DarkDieColor
                );

                if (!riskMessage) {
                  riskMessage = game.i18n.localize(
                    "CDG.DialogDarkDieRollPositive"
                  );
                }

                // ------
                // chat message setup
                const dialogData = {
                  diceOutput: diceOutput,
                  riskMessage: riskMessage
                }
                const template = 'systems/cthulhudeepgreen/templates/msg/dark-die-chat-content.hbs';
                const rendered_html = await renderTemplate(template, dialogData);
            
                ChatMessage.create({
                  user: game.user_id,
                  speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                  rollMode: game.settings.get("core", "rollMode"),
                  content: rendered_html,
                  flags: { cthulhudeepgreen: { chatID: "cthulhudeepgreen" }}
                });

                // ----
                resolve(null);
              },
            },
          },
          close: () => {
            resolve(null);
          },
        },
        { 
          id: "cdg-dialog-darkdie" 
      }).render(true);
    });
  }

  // ----------------
  // Risky Thing Roll
  // ----------------

  async riskyDialogContent() {
    const dialogData = {
      DarkDieColor: CONFIG.CDG.DarkDieColor
    };
    return await renderTemplate('systems/cthulhudeepgreen/templates/dialog/risky-thing.hbs', dialogData);
  }

  async asyncCDGRiskyThingDialog() {
    return await new Promise(async (resolve) => {
      new Dialog(
        {
          title: game.i18n.localize("CDG.RiskyDialogTitle"),
          content: await this.riskyDialogContent(),
          buttons: {
            button1: {
              icon: '<i class="fa-solid fa-dice"></i>',
              label: game.i18n.localize("CDG.ActionRoll"),
              callback: async (html) => {
                // get and roll selected dice
                const dice = [];
                if (document.getElementById("humanDie").checked) {
                  let hdRoll = await new Roll("1d6").evaluate({ async: true });
                  dice.push({
                    dieColor: CONFIG.CDG.BaseColor,
                    isRisk: false,
                    rollVal: hdRoll.result,
                  });
                }

                if (document.getElementById("occupationalDie").checked) {
                  let odRoll = await new Roll("1d6").evaluate({ async: true });
                  dice.push({
                    dieColor: CONFIG.CDG.BaseColor,
                    isRisk: false,
                    rollVal: odRoll.result,
                  });
                }

                if (document.getElementById("darkDie").checked) {
                  let idRoll = await new Roll("1d6").evaluate({ async: true });
                  dice.push({
                    dieColor: CONFIG.CDG.DarkDieColor,
                    isRisk: true,
                    rollVal: idRoll.result,
                  });
                }

                const darkDieEffectsInsight =
                  document.getElementById("insight").checked &&
                  document.getElementById("darkDie").checked;

                const maxDie = dice.reduce((a, b) =>
                  a.rollVal > b.rollVal ? a : b
                );

                // Determine if the risk die won
                let isRiskDie = false;
                dice.every((die) => {
                  if (die.rollVal == maxDie.rollVal && die.isRisk) {
                    isRiskDie = true;
                    return false;
                  }
                  return true;
                });

                let riskMessage = "";
                if (isRiskDie) {
                  riskMessage = this.darkDieChatContent(
                    maxDie.rollVal,
                    darkDieEffectsInsight,
                    true
                  );
                }

                // Build Dice list
                let diceOutput = "";
                dice.forEach((die) => {
                  diceOutput = diceOutput.concat(
                    this.getDiceForOutput(die.rollVal, die.dieColor),
                    " "
                  );
                });

                // ------
                // chat message setup
                const dialogData = {
                  diceOutput: diceOutput,
                  maxDieNumber: this.getMaxDieMessage(maxDie.rollVal),
                  riskMessage: riskMessage
                }
                const template = 'systems/cthulhudeepgreen/templates/msg/risky-thing-chat-content.hbs';
                const rendered_html = await renderTemplate(template, dialogData);
            
                ChatMessage.create({
                  user: game.user_id,
                  speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                  rollMode: game.settings.get("core", "rollMode"),
                  content: rendered_html,
                  flags: { cthulhudeepgreen: { chatID: "cthulhudeepgreen" }}
                });

                // ----
                resolve(null);
              },
            },
          },
          close: () => {
            resolve(null);
          },
        },
        { id: "cdg-dialog-risky" }
      ).render(true);
    });
  }

  // ------------
  // Simple Rolls
  // ------------

  async selfCareChatContent(diceNumber) {
    let previousStress = duplicate(this.actor.system.stress.value);
    const rollValue = +diceNumber;
    let newStress = previousStress - rollValue;
    newStress = newStress < 0 ? 0 : newStress;

    // reduce stress Stress
    // TODO update check boxes
    console.log("LOG rollValue: "+rollValue);
    this._reduceStressBy(rollValue);
    // this.actor.update({ "system.stress.value": newStress });

    const dialogData = {
      diceForOutput: this.getDiceForOutput(rollValue, CONFIG.CDG.BaseColor),
      selfCareRollContent: game.i18n.format("CDG.SelfCareRollContent", {previousstress: previousStress, newstress: newStress})
    }
    const template = 'systems/cthulhudeepgreen/templates/msg/self-care-chat-content.hbs';
    return await renderTemplate(template, dialogData);
  }

  async simpleRoll(rollType) {
    let simpleRoll = await new Roll("1d6").evaluate({ async: true });
    let chatContentMessage = "";

    switch (rollType) {
      case "selfcare": {
        chatContentMessage = await this.selfCareChatContent(simpleRoll.result);
        break;
      }
      case "failure": {
        const dialogData = {
          diceOutput: this.getDiceForOutput(simpleRoll.result, CONFIG.CDG.BaseColor),
        }
        const template = 'systems/cthulhudeepgreen/templates/msg/failure-chat-content.hbs';
        chatContentMessage = await renderTemplate(template, dialogData);
        break;
      }
      default: {
        console.error("Error in the simpleRoll, bad die rollType used.");
        return;
      }
    }
    
    // ------
    ChatMessage.create({
      user: game.user_id,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      rollMode: game.settings.get("core", "rollMode"),
      content: chatContentMessage,
      flags: { cthulhudeepgreen: { chatID: "cthulhudeepgreen" }}
    });
  }
}
