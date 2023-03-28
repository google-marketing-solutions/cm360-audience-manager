/**
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { generateMD5Hash } from '../util/hash';

/**
 * @fileoverview This file contains the definition of an audience.
 */

export interface AudienceRule {
  group: number;
  variableName: string;
  variableFriendlyName: string;
  operator: string;
  value: string;
  negation: boolean;
}

interface AudienceParameters {
  id?: string;
  name: string;
  description?: string;
  lifeSpan: number;
  floodlightId?: string;
  floodlightName?: string;
  rules: AudienceRule[];
  shares: string[];
}

/**
 * Audience representing the definition of an audience.
 */
export class Audience {
  private id_: string | undefined;
  private readonly name_: string;
  private readonly description_: string;
  private readonly lifeSpan_: number;
  private readonly floodlightId_: string | undefined;
  private readonly floodlightName_: string | undefined;
  private readonly rules_: AudienceRule[];
  private shares_: string[];

  /**
   * @constructs an instance of Audience.
   *
   * @param {AudienceParameters} params
   */
  constructor(params: AudienceParameters) {
    this.id_ = params.id;
    this.name_ = params.name;
    this.description_ = params.description ?? '';
    this.lifeSpan_ = params.lifeSpan;
    this.floodlightId_ = params.floodlightId;
    this.floodlightName_ = params.floodlightName;
    this.rules_ = params.rules?.length > 0 ? params.rules : [];
    this.shares_ = params.shares?.length > 0 ? params.shares : [];
  }

  /**
   * Return the Audience ID.
   *
   * @returns {string|undefined} The Audience ID
   */
  getId(): string | undefined {
    return this.id_;
  }

  /**
   * Set the Audience ID.
   *
   * @param {string} id The Audience ID
   */
  setId(id: string) {
    this.id_ = id;
  }

  /**
   * Returns the audienceName.
   *
   * @returns {string} The audienceName
   */
  getName(): string {
    return this.name_;
  }

  /**
   * Returns the description.
   *
   * @returns {string} The description
   */
  getDescription(): string {
    return this.description_;
  }

  /**
   * Returns the lifeSpan.
   *
   * @returns {number} The lifeSpan
   */
  getLifeSpan(): number {
    return this.lifeSpan_;
  }

  /**
   * Returns the Floodlight ID.
   *
   * @returns {string|undefined} The Floodlight ID
   */
  getFloodlightId(): string | undefined {
    return this.floodlightId_;
  }

  /**
   * Returns the Floodlight name.
   *
   * @returns {string|undefined} The Floodlight name
   */
  getFloodlightName(): string | undefined {
    return this.floodlightName_;
  }

  /**
   * Returns the audience rules.
   *
   * @returns {AudienceRule[]} The audience rules
   */
  getRules(): AudienceRule[] {
    return this.rules_;
  }

  /**
   * Returns the advertiser shares.
   *
   * @returns {string[]} The advertiser shares
   */
  getShares(): string[] {
    return this.shares_;
  }

  /**
   * Set the advertiser shares.
   *
   * @param {string[]} shares The advertiser shares
   */
  setShares(shares: string[]) {
    this.shares_ = shares;
  }

  /**
   * Calculate MD5 checksum of some audience fields.
   *
   * @returns {string}
   */
  getChecksum(): string {
    const input = JSON.stringify({
      name: this.name_,
      lifespan: this.lifeSpan_,
      description: this.description_,
      floodlightId: this.floodlightId_,
      rules: this.rules_,
    });

    // return HashUtil.generateMD5Hash(input);
    return generateMD5Hash(input);
  }

  /**
   * Calculate MD5 checksum of advertiser shares.
   *
   * @returns {string}
   */
  getSharesChecksum(): string {
    const input = JSON.stringify(this.shares_);

    // return HashUtil.generateMD5Hash(input);
    return generateMD5Hash(input);
  }

  /**
   * Return string representation of Audience.
   *
   * @returns {string}
   */
  toJson(): string {
    return JSON.stringify(this);
  }

  /**
   * Parse Audience from JSON string representation of Audience.
   *
   * @param {!Audience} json
   *
   * @returns {!Audience}
   */
  static fromJson(json: Audience): Audience {
    return new Audience({
      id: json.id_,
      name: json.name_,
      description: json.description_,
      lifeSpan: json.lifeSpan_,
      floodlightId: json.floodlightId_,
      floodlightName: json.floodlightName_,
      rules: json.rules_,
      shares: json.shares_,
    });
  }
}
