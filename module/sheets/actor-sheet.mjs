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
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "main",
        },
      ],
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
    const element = event.currentTarget;
    const dataset = element.dataset;

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

  async darkDieDialogContent() {
    return await renderTemplate('systems/cthulhudeepgreen/templates/dialog/dark-die.hbs');
  }

  darkDieRollChatContent(diceOutput, riskMessage) {
    return `
        <p>
          <b style="font-size: 1.5em;">${game.i18n.localize("CDG.DarkDieDialogTitle")}: </b>
          ${diceOutput}
        </p>
        ${riskMessage}
    `;
  }

  async asyncCDGDarkDieRollDialog() {
    return await new Promise(async (resolve) => {
      new Dialog({
          title: game.i18n.localize("CDG.DarkDieDialogTitle"),
          content: await this.darkDieDialogContent(),
          buttons: {
            button1: {
              icon: '<i class="fa-solid fa-dice"></i>',
              label: game.i18n.localize("CDG.ActionRoll"),
              callback: async (html) => {
                const darkDieEffectsInsight =
                  document.getElementById("insight").checked;
                const darkDieEffectsStress =
                  document.getElementById("stress").checked;

                if (!darkDieEffectsInsight && !darkDieEffectsStress) {
                  return;
                }

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

                // Initialize chat data.
                const chatContentMessage = this.darkDieRollChatContent(
                  diceOutput,
                  riskMessage
                );
                const user = game.user.id;
                const speaker = ChatMessage.getSpeaker({ actor: this.actor });
                const rollMode = game.settings.get("core", "rollMode");

                ChatMessage.create({
                  user: user,
                  speaker: speaker,
                  rollMode: rollMode,
                  content: chatContentMessage,
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

  getRiskMoveMessage() {
    return `
        <hr>
        <div style="font-size: 18px">
          <b>${game.i18n.format("CDG.RiskMoveMessage")}</b>
        <div>
    `;
  }

  riskyThingChatContent(diceOutput, maxDieNumber, riskMessage) {
    return `
        <p>
          <b style="font-size: 1.5em;">${game.i18n.localize(
            "CDG.RiskyDialogTitle"
          )}: </b>
          ${diceOutput}
        </p>
        <hr>
        <p>${this.getMaxDieMessage(maxDieNumber)}</p>
        ${riskMessage}
    `;
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

                // Initialize chat data.
                const chatContentMessage = this.riskyThingChatContent(
                  diceOutput,
                  maxDie.rollVal,
                  riskMessage
                );
                const user = game.user.id;
                const speaker = ChatMessage.getSpeaker({ actor: this.actor });
                const rollMode = game.settings.get("core", "rollMode");

                ChatMessage.create({
                  user: user,
                  speaker: speaker,
                  rollMode: rollMode,
                  content: chatContentMessage,
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

  failureChatContent(diceOutput) {
    return `
        <p>
          <span style="font-size: 1.5em;">
            ${game.i18n.localize("CDG.FailureRoll")} 
          </span> 
          ${diceOutput}
        </p>
        <hr>
        ${game.i18n.localize("CDG.FailureRollContent")}
    `;
  }

  selfCareChatContent(diceNumber) {
    let previousStress = duplicate(this.actor.system.stress.value);
    const rollValue = +diceNumber;
    let newStress = previousStress - rollValue;
    newStress = newStress < 0 ? 0 : newStress;

    // update Stress
    this.actor.system.stress.value = newStress;
    this.actor.update({ "system.stress.value": newStress });

    let selfCareMessage = `<p><span style="font-size: 1.5em;">${game.i18n.localize(
      "CDG.SelfCareRoll"
    )} </span>${this.getDiceForOutput(
      diceNumber,
      CONFIG.CDG.BaseColor
    )}</p><hr>`;
    return selfCareMessage.concat(
      game.i18n.format("CDG.SelfCareRollContent", {
        previousstress: previousStress,
        newstress: newStress
      })
    );
  }

  async simpleRoll(rollType) {
    let simpleRoll = await new Roll("1d6").evaluate({ async: true });
    let chatContentMessage = "";

    switch (rollType) {
      case "selfcare": {
        chatContentMessage = this.selfCareChatContent(simpleRoll.result);
        break;
      }
      case "failure": {
        chatContentMessage = this.failureChatContent(
          this.getDiceForOutput(simpleRoll.result, CONFIG.CDG.BaseColor)
        );
        break;
      }
      default: {
        console.error("Error in the simpleRoll, bad die rollType used.");
        return;
      }
    }

    const user = game.user.id;
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get("core", "rollMode");

    ChatMessage.create({
      user: user,
      speaker: speaker,
      rollMode: rollMode,
      content: chatContentMessage,
    });
  }
}
