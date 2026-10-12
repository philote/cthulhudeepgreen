const { HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Extend the basic ActorSheetV2 with some very simple modifications
 * @extends {ActorSheetV2}
 */
export class CthulhuDeepGreenActorSheet extends HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2) {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["cthulhudeepgreen", "sheet", "actor"],
    position: { width: 670, height: 650 },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: {
      roll: CthulhuDeepGreenActorSheet.#onRoll,
    },
  };

  /** @override */
  static PARTS = {
    sheet: { template: "systems/cthulhudeepgreen/templates/actor/actor-character-sheet.hbs" },
  };

  /** @override */
  static TABS = {
    primary: {
      tabs: [
        { id: "main", label: "CDG.ActorTabMain" },
        { id: "biography", label: "CDG.ActorTabBiography" },
      ],
      initial: "main",
    },
  };

  /** @inheritDoc */
  _initializeApplicationOptions(options) {
    options = super._initializeApplicationOptions(options);
    if (options.document.type === "npc") {
      options.position.width = 310;
      options.position.height = 780;
    }
    return options;
  }

  /** @inheritDoc */
  _configureRenderParts(options) {
    const parts = super._configureRenderParts(options);
    parts.sheet.template = `systems/cthulhudeepgreen/templates/actor/actor-${this.actor.type}-sheet.hbs`;
    return parts;
  }

  /* -------------------------------------------- */

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    // Add the actor's data to context for easier access, as well as flags.
    context.actor = this.actor;
    context.system = this.actor.system;
    context.flags = this.actor.flags;

    // Enriched notes for the ProseMirror editor.
    context.enrichedNotes = await foundry.applications.ux.TextEditor.implementation.enrichHTML(this.actor.system.notes, {
      secrets: this.actor.isOwner,
      rollData: this.actor.getRollData(),
      relativeTo: this.actor,
    });

    return context;
  }

  /** @inheritDoc */
  async _onRender(context, options) {
    await super._onRender(context, options);
    // Mark sheets the user can view but not edit, so their fields can be dimmed
    this.element.classList.toggle("read-only", !this.isEditable);
  }

  /* -------------------------------------------- */

  /**
   * Handle clickable rolls.
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The element with the data-action
   * @this {CthulhuDeepGreenActorSheet}
   */
  static #onRoll(event, target) {
    const dataset = target.dataset;

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

  _increaseStressByOne() {
    let newStress = foundry.utils.duplicate(this.actor.system.stress.value);

    if (newStress < 6) {
      let currentArray = this.actor.system.stress.states;
      const firstPos = currentArray.indexOf(false);
      if (firstPos != -1) {
        currentArray[firstPos] = true;
        this.actor.update({ ["system.stress.states"]: currentArray });
      }
    }
  }

  _increaseInsightByOne() {
    let newInsight = foundry.utils.duplicate(this.actor.system.insight.value);

    if (newInsight < 6) {
      let currentArray = this.actor.system.insight.states;
      const firstPos = currentArray.indexOf(false);
      if (firstPos != -1) {
        currentArray[firstPos] = true;
        this.actor.update({ ["system.insight.states"]: currentArray });
      }
    }
  }

  // ----------------------
  // Dice rolling functions
  // ----------------------

  _configureDiceSoNiceAppearance(roll, backgroundColor) {
    if (game.dice3d) {
      roll.dice[0].options.appearance = {
        colorset: "custom",
        foreground: "#000000",
        background: backgroundColor,
      };
    }
  }

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
    const previousStress = foundry.utils.duplicate(this.actor.system.stress.value);
    const previousInsight = foundry.utils.duplicate(this.actor.system.insight.value);
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
      this._increaseStressByOne();

      ++newStress;
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
      this._increaseInsightByOne();

      ++newInsight;
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
    const data = await foundry.applications.api.DialogV2.input({
      id: "cdg-dialog-darkdie",
      window: { title: "CDG.DarkDieDialogTitle" },
      content: await foundry.applications.handlebars.renderTemplate('systems/cthulhudeepgreen/templates/dialog/dark-die.hbs'),
      ok: { icon: "fa-solid fa-dice", label: "CDG.ActionRoll" },
    });
    if (!data) {return;}

    const darkDieEffectsInsight = data.insight;
    const darkDieEffectsStress = data.stress;

    if (!darkDieEffectsInsight && !darkDieEffectsStress) {return;}

    const darkDieRoll = await new Roll("1d6").evaluate();
    this._configureDiceSoNiceAppearance(darkDieRoll, CONFIG.CDG.DarkDieColor);

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
    const rendered_html = await foundry.applications.handlebars.renderTemplate(template, dialogData);

    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: rendered_html,
      rolls: [darkDieRoll],
      flags: { cthulhudeepgreen: { chatID: "cthulhudeepgreen" }}
    }, { messageMode: game.settings.get("core", "messageMode") });
  }

  // ----------------
  // Risky Thing Roll
  // ----------------

  async riskyDialogContent() {
    const dialogData = {
      DarkDieColor: CONFIG.CDG.DarkDieColor
    };
    return await foundry.applications.handlebars.renderTemplate('systems/cthulhudeepgreen/templates/dialog/risky-thing.hbs', dialogData);
  }

  async asyncCDGRiskyThingDialog() {
    const data = await foundry.applications.api.DialogV2.input({
      id: "cdg-dialog-risky",
      window: { title: "CDG.RiskyDialogTitle" },
      content: await this.riskyDialogContent(),
      ok: { icon: "fa-solid fa-dice", label: "CDG.ActionRoll" },
    });
    if (!data) {return;}

    // get and roll selected dice
    const dice = [];
    if (data.humanDie) {
      let hdRoll = await new Roll("1d6").evaluate();
      dice.push({
        dieColor: CONFIG.CDG.BaseColor,
        isRisk: false,
        rollVal: hdRoll.result,
        roll: hdRoll,
      });
    }

    if (data.occupationalDie) {
      let odRoll = await new Roll("1d6").evaluate();
      dice.push({
        dieColor: CONFIG.CDG.BaseColor,
        isRisk: false,
        rollVal: odRoll.result,
        roll: odRoll,
      });
    }

    if (data.darkDie) {
      let idRoll = await new Roll("1d6").evaluate();
      dice.push({
        dieColor: CONFIG.CDG.DarkDieColor,
        isRisk: true,
        rollVal: idRoll.result,
        roll: idRoll,
      });
    }

    const darkDieEffectsInsight = data.insight && data.darkDie;

    if (dice.length === 0) {return;}

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
    const rendered_html = await foundry.applications.handlebars.renderTemplate(template, dialogData);

    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: rendered_html,
      rolls: dice.map((die) => {
        if (die.isRisk) this._configureDiceSoNiceAppearance(die.roll, die.dieColor);
        return die.roll;
      }),
      flags: { cthulhudeepgreen: { chatID: "cthulhudeepgreen" }}
    }, { messageMode: game.settings.get("core", "messageMode") });
  }

  // ------------
  // Simple Rolls
  // ------------

  async selfCareChatContent(diceNumber) {
    let previousStress = foundry.utils.duplicate(this.actor.system.stress.value);
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
    return await foundry.applications.handlebars.renderTemplate(template, dialogData);
  }

  async simpleRoll(rollType) {
    let simpleRoll = await new Roll("1d6").evaluate();
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
        chatContentMessage = await foundry.applications.handlebars.renderTemplate(template, dialogData);
        break;
      }
      default: {
        console.error("Error in the simpleRoll, bad die rollType used.");
        return;
      }
    }
    
    // ------
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: chatContentMessage,
      rolls: [simpleRoll],
      flags: { cthulhudeepgreen: { chatID: "cthulhudeepgreen" }}
    }, { messageMode: game.settings.get("core", "messageMode") });
  }
}
