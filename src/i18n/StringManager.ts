/**
 * StringManager.ts
 *
 * Centralizes string management for LadyBug.
 * Provides access to localized strings for all components.
 */

import { LocalizedString, type ReadOnlyProperty } from "scenerystack";
import ladyBug from "../LadyBugNamespace.js";
import stringsEn from "./strings_en.json";
import stringsFr from "./strings_fr.json";

// ── Compile-time key-parity check ─────────────────────────────────────────────
// satisfies errors immediately if either locale file is missing keys from the other.
// biome-ignore lint/complexity/noVoid: intentional compile-time type assertion
void (stringsEn satisfies typeof stringsFr);
// biome-ignore lint/complexity/noVoid: intentional compile-time type assertion
void (stringsFr satisfies typeof stringsEn);

export class StringManager {
  private static instance: StringManager;
  private readonly stringProperties;

  private constructor() {
    this.stringProperties = LocalizedString.getNestedStringProperties({
      en: stringsEn,
      fr: stringsFr,
    });
  }

  public static getInstance(): StringManager {
    if (!StringManager.instance) {
      StringManager.instance = new StringManager();
      ladyBug.register("StringManager", StringManager.instance);
    }
    return StringManager.instance;
  }

  public getTitleStringProperty(): ReadOnlyProperty<string> {
    return this.stringProperties.titleStringProperty;
  }

  public getScreenNames(): { ladyBugStringProperty: ReadOnlyProperty<string> } {
    return {
      ladyBugStringProperty: this.stringProperties.screens.ladyBugStringProperty,
    };
  }

  public getVectorsStrings() {
    return this.stringProperties.vectors;
  }

  public getMotionStrings() {
    return this.stringProperties.motion;
  }

  public getTraceStrings() {
    return this.stringProperties.trace;
  }

  public getRemoteControlStrings() {
    return this.stringProperties.remoteControl;
  }

  public getPlaybackStrings() {
    return this.stringProperties.playback;
  }

  public getReturnLadybugStringProperty(): ReadOnlyProperty<string> {
    return this.stringProperties.returnLadybugStringProperty;
  }
}
