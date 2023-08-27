/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class CthulhuDeepGreenActor extends Actor {

  /** @override */
  prepareData() {
    super.prepareData();
  }

  /**
   * @override
   * Augment the basic actor data with additional dynamic data. Typically,
   * you'll want to handle most of your calculated/derived data in this step.
   * Data calculated in this step should generally not exist in template.json
   * (such as ability modifiers rather than ability scores) and should be
   * available both inside and outside of character sheets (such as if an actor
   * is queried and has a roll executed directly from it).
   */
  prepareDerivedData() {
    const actorData = this;

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    this._prepareCharacterData(actorData);
    // this._prepareNpcData(actorData);
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    if (actorData.type !== 'character') return;

    // Make modifications to data here. For example:
    const systemData = actorData.system;

    // update Insight so they can be used as token resources
    systemData.insight.value = systemData.insight.states.filter(Boolean).length;
    systemData.stress.value = systemData.stress.states.filter(Boolean).length;
  }

  /**
   * Prepare NPC type specific data.
   */
  // _prepareNpcData(actorData) {
  //   if (actorData.type !== 'npc') return;

  //   // Make modifications to data here. For example:
  //   // const systemData = actorData.system;
  // }
}
