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
 * @fileoverview This file encapsulates all logic for creating audiences defined
 * in the associated Google Sheets spreadsheet.
 */


/**
 * @class AudienceCreateJobController representing a class for holding all logic
 * for handling create audience jobs triggered by the underlying jobs
 * infrastructure.
 */
class AudienceCreateJobController {
  /**
   * @constructs an instance of AudienceCreateJobController.
   *
   * @param {!SheetsService} sheetsService The injected SheetsService dependency
   * @param {!CampaignManagerFacade} campaignManagerService The injected
   *     CampaignManagerFacade dependency
   */
  constructor(sheetsService, campaignManagerService) {
    /** @private @const {!SheetsService} */
    this.sheetsService_ = sheetsService;

    /** @private @const {!CampaignManagerFacade} */
    this.campaignManagerService_ = campaignManagerService;
  }

  /**
   * Creates audiences added to the underlying spreadsheet.
   *
   * @param {!Job} job The job instance passed by the jobs infrastructure
   * @param {{
   *     sheetName: string,
   *     row: number,
   *     col: number,
   *     nameCol: number,
   *     statusCol: number,
   * }=} params
   * @return {!Job} The modified job instance
   */
  createAudiences(job, {
      sheetName = CONFIG.audiences.create.sheetName,
      row = CONFIG.audiences.create.row,
      col = CONFIG.audiences.create.col,
      nameCol = CONFIG.audiences.create.cols.name,
      statusCol = CONFIG.audiences.create.cols.status} = {}) {
    this.getSheetsService().showToast(
        /* message= */ 'Creating new audiences...',
        /* title= */ 'Create');

    const audiences = this.getSheetsService().getRangeData(sheetName, row, col);
    const jobs = audiences
        .filter((audience) =>
          audience.length !== 0 &&
            String(audience[nameCol]) &&
            !String(audience[statusCol]))
        .map((audience, index) =>
          this.createAudienceCreateJob(audience, index));
    job.getJobs().push(...jobs);

    return job;
  }

  /**
   * Creates an {@link AudienceCreateJob} instance for the given audience data.
   *
   * @param {?Array<?Object>} audience The audience row of data from the
   *     underlying sheet
   * @param {number} index The index of the audience in the audiences array
   * @param {{
   *     nameCol: number,
   *     lifeSpanCol: number,
   *     descriptionCol: number,
   *     floodlightIdCol: number,
   * }=} params
   * @return {!AudienceCreateJob} The created AudienceCreateJob instance
   */
  createAudienceCreateJob(audience, index, {
      nameCol = CONFIG.audiences.create.cols.name,
      lifeSpanCol = CONFIG.audiences.create.cols.lifeSpan,
      descriptionCol = CONFIG.audiences.create.cols.description,
      floodlightIdCol = CONFIG.audiences.create.cols.floodlightId} = {}) {
    const audienceName = String(audience[nameCol]);
    console.log(`Creating job for audience "${audienceName}"`);

    const audienceCreateJob = new AudienceCreateJob({
      audienceName: audienceName,
      description: String(audience[descriptionCol]),
      lifeSpan: String(audience[lifeSpanCol]),
      idx: index,
      floodlightId: this.extractFloodlightId(String(audience[floodlightIdCol])),
    });

    const audienceRules = this.createAudienceRules(audience);
    audienceCreateJob
        .addAudienceRules(audienceRules.rules, audienceRules.relationship);

    return audienceCreateJob;
  }

  /**
   * Extracts the ID part of the floodlight ID and name string and returns it,
   * or returns 'undefined' if the input string was empty or did not match the
   * given regex.
   *
   * @param {string} idAndNameString The floodlight id-and-name string from the
   *     underlying spreadsheet, which could be empty
   * @param {string=} regex The regex to use. Defaults to the config in
   *     globals.js
   * @return {number|undefined} The extracted floodlightId as a number, or
   *     undefined if the input string was empty or did not match the regex
   */
  extractFloodlightId(
      idAndNameString, regex = CONFIG.floodlights.idAndNameRegex) {
    const regexp = new RegExp(regex, 'g');
    const matches = idAndNameString.matchAll(regexp);
    let result;

    for (const match of matches) {
      const res = match.toString().split(',');
      result = Number(res[1]);
    }
    return result;
  }

  /**
   * Creates audience rules for the given audience data.
   *
   * @param {?Array<?Object>} audience The audience row of data from the
   *     underlying sheet
   * @param {{
   *     rulesRelationship: number,
   *     rulesRangeStart: number,
   *     rulesRangeEnd: number,
   *     rulesRangeLength: number,
   *     nameIndex: number,
   *     operatorIndex: number,
   *     valueIndex: number,
   *     negationIndex: number,
   *     separator: string,
   * }=} params
   * @return {{
   *     relationship: !AudienceRuleRelationshipType,
   *     rules: !Array<{
   *         name: string,
   *         operator: string,
   *         value: string,
   *         negation: boolean,
   *     }>,
   * }} The created audience rules
   */
  createAudienceRules(audience, {
      rulesRelationship = CONFIG.audiences.create.cols.rules.relationship,
      rulesRangeStart = CONFIG.audiences.create.cols.rules.rangeStart,
      rulesRangeEnd = CONFIG.audiences.create.cols.rules.rangeEnd,
      rulesRangeLength = CONFIG.audiences.create.cols.rules.rangeLength,
      nameIndex = CONFIG.audiences.create.cols.rules.rangeIndex.name,
      operatorIndex = CONFIG.audiences.create.cols.rules.rangeIndex.operator,
      valueIndex = CONFIG.audiences.create.cols.rules.rangeIndex.value,
      negationIndex = CONFIG.audiences.create.cols.rules.rangeIndex.negation,
      separator = CONFIG.customVariables.separator} = {}) {
    /**
     * @type {!Array<{
     *     name: string,
     *     operator: string,
     *     value: string,
     *     negation: boolean,
     * }>}
     */
    const rules = [];

    for (let i = rulesRangeStart; i <= rulesRangeEnd; i += rulesRangeLength) {
      const name = String(audience[i + nameIndex]).split(separator, 1)[0];
      const operator = String(audience[i + operatorIndex]);
      const value = String(audience[i + valueIndex]);
      const negation = String(audience[i + negationIndex]) === 'true';

      if (name && operator && value) {
        rules.push({
          name: name,
          operator: operator,
          value: value,
          negation: negation,
        });
      }
    }
    const relationship = String(audience[rulesRelationship]) ?
        AudienceRuleRelationshipType[String(audience[rulesRelationship])] :
        AudienceRuleRelationshipType.AND;

    const result = {
      relationship: relationship,
      rules: rules,
    };
    return result;
  }

  /**
   * Creates a single audience. Tiggered once for every added audiences from
   * {@link #createAudiences}.
   *
   * @param {!AudienceCreateJob} job The job instance passed by the jobs
   *     infrastructure
   * @param {{
   *     sheetName: string,
   *     row: number,
   *     statusCol: number,
   *     defaultState: boolean,
   *     listSource: string,
   * }=} params
   * @return {!AudienceCreateJob} The job instance
   */
  createAudience(job, {
      sheetName = CONFIG.audiences.create.sheetName,
      row = CONFIG.audiences.create.row,
      statusCol = CONFIG.audiences.create.cols.status,
      defaultState = CONFIG.audiences.create.defaultState,
      listSource = CONFIG.audiences.create.listSource} = {}) {
    const audienceName = job.getAudienceName();
    console.log(`Creating audience "${audienceName}"...`);

    const listPopulationRule = this.createListPopulationRule(
        job.getFloodlightId(), job.getAudienceRules());
    const remarketingList = {
      name: audienceName,
      description: job.getDescription(),
      lifeSpan: job.getLifeSpan(),
      listPopulationRule: listPopulationRule,
      active: defaultState,
      listSource: listSource,
    };
    let status;

    try {
      const result = this.getCampaignManagerService()
          .createRemarketingList(remarketingList);
      status = `Success! Audience ID: ${result.id}`;

      const message = `Created audience "${audienceName}" successfully!`;
      console.log(message);
      job.log([message]);
    } catch (error) {
      status = `Error! ${error.message}`;

      const message = `Error while creating audience "${audienceName}"!`;
      console.log(message);
      job.log([message]);
    }
    this.getSheetsService().setCellValue(
        row + job.getIndex(), statusCol + 1, /* val= */ status, sheetName);
    return job;
  }

  /**
   * Create the List Population Rule object of the remarketing list that will
   * be created based on the provided audience rules from the underlying
   * spreadsheet.
   *
   * @param {number|undefined} floodlightId The floodlight ID
   * @param {{
   *     relationship: !AudienceRuleRelationshipType,
   *     rules: !Array<{
   *         name: string,
   *         operator: string,
   *         value: string,
   *         negation: boolean,
   *     }>,
   * }} audienceRules The audience rules
   * @param {{
   *     termType: string,
   *     separator: string,
   * }=} params
   * @return {{
   *     floodlightActivityId: (number|undefined),
   *     listPopulationClauses: (!Array<{terms: !Array<!Object>}>|undefined),
   * }} The created list population rule object
   */
  createListPopulationRule(floodlightId, audienceRules, {
      termType = CONFIG.audiences.create.cols.rules.termType,
      separator = CONFIG.audiences.create.cols.rules.separator} = {}) {
    let listPopulationRule = {floodlightActivityId: floodlightId};

    if (audienceRules.rules.length !== 0) {
      let /** !Array<{terms: !Array<!Object>}> */ listPopulationClauses =
          audienceRules.rules.map((rule) => {
            const /** !Array<!Object> */ terms =
                rule.value.split(separator).map((val) => {
                  return {
                    variableName: rule.name,
                    type: termType,
                    operator: rule.operator,
                    value: val,
                    negation: rule.negation,
                  };
                });
            return {terms: terms};
          });

      if (audienceRules.relationship === AudienceRuleRelationshipType.OR) {
        listPopulationClauses = [{
          terms: listPopulationClauses.flatMap((clause) => clause.terms),
        }];
      }
      listPopulationRule = UriUtil.extend(listPopulationRule, {
        listPopulationClauses: listPopulationClauses,
      });
    }
    return listPopulationRule;
  }

  /**
   * Returns the SheetsService instance.
   *
   * @return {!SheetsService} The SheetsService instance
   */
  getSheetsService() {
    return this.sheetsService_;
  }

  /**
   * Returns the CampaignManagerFacade instance.
   *
   * @return {!CampaignManagerFacade} The CampaignManagerFacade instance
   */
  getCampaignManagerService() {
    return this.campaignManagerService_;
  }

}

