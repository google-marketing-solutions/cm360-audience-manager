/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview This file contains the definition of an audience create job
 * object that is used by the jobs infrastructure for parallel processing.
 */


/**
 * Defines the audience relationship type enum, which represents the desired
 * logical relationship between the rules in the rules array.
 * @enum {string}
 */
const AudienceRuleRelationshipType = {
  AND: 'AND',
  OR: 'OR',
};

/**
 * @class AudienceCreateJob representing the definition of an AudienceCreate
 * job.
 */
class AudienceCreateJob extends Job {
  /**
   * @constructs an instance of AudienceCreateJob.
   *
   * @param {{
   *     audienceName: string,
   *     description: string,
   *     lifeSpan: string,
   *     idx: number,
   *     floodlightId: (number|undefined),
   * }} extParams
   * @param {{
   *     id: number,
   *     index: number,
   *     run: boolean,
   *     logs: !Array<{date: !Date, message: string}>,
   *     jobs: !Array<!AudienceCreateJob>,
   *     offset: number,
   *     error: string,
   *     jobType: !JobType,
   * }=} baseParams
   */
  constructor(
      {
        audienceName,
        description,
        lifeSpan,
        idx,
        floodlightId,
      },
      {
        id = 0,
        index = idx,
        run = true,
        logs = [],
        jobs = [],
        offset = 0,
        error = '',
        jobType = JobType.AUDIENCE_CREATE,
      } = {}) {
    super(id, index, run, logs, jobs, offset, error, jobType);

    /** @private @const {string} */
    this.audienceName_ = audienceName;

    /** @private @const {string} */
    this.description_ = description;

    /** @private @const {string} */
    this.lifeSpan_ = lifeSpan;

    /** @private @const {number|undefined} */
    this.floodlightId_ = floodlightId;

    /**
     * @private {{
     *     relationship: !AudienceRuleRelationshipType,
     *     rules: !Array<{
     *         name: string,
     *         operator: string,
     *         value: string,
     *         negation: boolean,
     *     }>,
     * }}
     */
    this.audienceRules_ = {
      relationship: AudienceRuleRelationshipType.AND,
      rules: [],
    };
  }

  /**
   * Returns the audienceName.
   *
   * @return {string} The audienceName
   */
  getAudienceName() {
    return this.audienceName_;
  }

  /**
   * Returns the description.
   *
   * @return {string} The description
   */
  getDescription() {
    return this.description_;
  }

  /**
   * Returns the lifeSpan.
   *
   * @return {string} The lifeSpan
   */
  getLifeSpan() {
    return this.lifeSpan_;
  }

  /**
   * Returns the floodlightId.
   *
   * @return {number|undefined} The floodlightId
   */
  getFloodlightId() {
    return this.floodlightId_;
  }

  /**
   * Returns the audience rules.
   *
   * @return {{
   *     relationship: !AudienceRuleRelationshipType,
   *     rules: !Array<{
   *         name: string,
   *         operator: string,
   *         value: string,
   *         negation: boolean,
   *     }>,
   * }} The audience rules
   */
  getAudienceRules() {
    return this.audienceRules_;
  }

  /**
   * Adds audience rules to the audience rules array, setting the relationship
   * type (or resetting it if previously set).
   *
   * @param {!Array<{
   *     name: string,
   *     operator: string,
   *     value: string,
   *     negation: boolean,
   * }>} audienceRules The audience rules to add
   * @param {!AudienceRuleRelationshipType=} audienceRuleRelationshipType The
   *     audience rule relationship type
   */
  addAudienceRules(audienceRules, audienceRuleRelationshipType = undefined) {
    if (audienceRuleRelationshipType) {
      this.getAudienceRules().relationship = audienceRuleRelationshipType;
    }
    this.getAudienceRules().rules.push(...audienceRules);
  }

}

