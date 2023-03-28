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

import { type CampaignManagerFacade } from '../facade/cm360';
import { CONFIG } from '../config';
import { Audience, type AudienceRule } from '../model/audience';
import { AudienceLoadJob } from '../model/audienceLoadJob';
import { Job } from '../model/job';
import { type SheetsService } from '../service/sheets';
import { JobUtil } from '../util/job';

/**
 * @fileoverview This file encapsulates all logic for creating and manipulating
 * audiences defined in the associated Google Sheets spreadsheet.
 */

/**
 * AudiencesController representing a class for holding all logic for
 * creating and manipulating audiences.
 */
export class AudiencesController {
  private readonly sheetsService_: SheetsService;
  private readonly campaignManagerService_: CampaignManagerFacade;
  private rules_: Array<Array<Record<string, unknown>>>;

  /**
   * @constructs an instance of AudiencesController.
   *
   * @param {!SheetsService} sheetsService The injected SheetsService dependency
   * @param {!CampaignManagerFacade} campaignManagerService The injected
   *     CampaignManagerFacade dependency
   */
  constructor(
    sheetsService: SheetsService,
    campaignManagerService: CampaignManagerFacade
  ) {
    this.sheetsService_ = sheetsService;
    this.campaignManagerService_ = campaignManagerService;
    this.rules_ = [];
  }

  /**
   * Retrieves user defined variable configurations for the logged in user and
   * CM360 Network and writes them to the associated sheet.
   *
   * @param {{
   *     sheetName: string,
   *     row: number,
   *     col: number,
   *     separator: string,
   * }=} params
   * @returns {UserDefinedVariableConfiguration[]}
   */
  fetchAndOutputCustomVariables({
    sheetName = CONFIG.customVariables.sheetName,
    row = CONFIG.customVariables.row,
    col = CONFIG.customVariables.col,
    separator = CONFIG.customVariables.separator,
  } = {}) {
    this.getSheetsService().clearDefinedRange(sheetName, row, col);

    const data: GoogleAppsScript.CampaignManager.UserDefinedVariableConfiguration[] =
      this.getCampaignManagerService().getUserDefinedVariableConfigurations();

    const output =
      data.length !== 0
        ? data.map(v => [`${v.variableType}${separator}${v.reportName}`])
        : [];

    this.getSheetsService().setValuesInDefinedRange(
      sheetName,
      row,
      col,
      output
    );

    return data;
  }

  /**
   * Retrieves configured floodlight activities from the logged in user's
   * CM360 Network and Advertiser, and writes them to the associated sheet.
   *
   * @param {{
   *     sheetName: string,
   *     row: number,
   *     col: number,
   * }=} params
   * @returns {!Array<!Object>} The floodlight activities array
   */
  fetchAndOutputFloodlightActivities({
    sheetName = CONFIG.floodlights.sheetName,
    row = CONFIG.floodlights.row,
    col = CONFIG.floodlights.col,
  } = {}) {
    this.getSheetsService().clearDefinedRange(sheetName, row, col);

    const data = this.getCampaignManagerService().getFloodlightActivities();

    const output =
      data.length !== 0
        ? data.map(element => [element.id, `${element.name} (${element.id})`])
        : [];
    this.getSheetsService().setValuesInDefinedRange(
      sheetName,
      row,
      col,
      output
    );

    return data;
  }

  /**
   * Retrieves Advertisers belonging to the given CM360 Network and writes them
   * to the associated sheet through a callback that is called once per fetched
   * 'page' of data.
   *
   * @param {{
   *     sheetName: string,
   *     row: number,
   *     col: number,
   *     maxResultsPerPage: number,
   *     accountDataSheetName: string,
   *     advertiserIdRow: number,
   *     advertiserIdCol: number
   * }=} params
   */
  fetchAndOutputAdvertisers({
    sheetName = CONFIG.advertisers.sheetName,
    row = CONFIG.advertisers.row,
    col = CONFIG.advertisers.col,
    maxResultsPerPage = CONFIG.advertisers.maxResultsPerPage,
    accountDataSheetName = CONFIG.accountData.sheetName,
    advertiserIdRow = CONFIG.accountData.advertiserId.row,
    advertiserIdCol = CONFIG.accountData.advertiserId.col,
  } = {}) {
    this.getSheetsService().clearDefinedRange(sheetName, row, col);

    const ownAdvertiserId = this.getSheetsService().getCellValue(
      accountDataSheetName,
      advertiserIdRow,
      advertiserIdCol
    );

    const callback = (
      advertisers: GoogleAppsScript.CampaignManager.Advertiser[]
    ) => {
      this.outputAdvertisers(advertisers, String(ownAdvertiserId));
    };

    this.getCampaignManagerService().getAdvertisers(
      maxResultsPerPage,
      callback
    );
  }

  /**
   * Delegates to {@link SheetsService} to write the given data to the
   * associated spreadsheet. Used as a callback within.
   * The advertiser ID the sheet is based on will be filtered out
   * because remarketing lists are shared with it by default and it
   * leads to errors trying to re-share
   * {@link #fetchAndOutputAdvertisers}.
   *
   * @param {Advertiser[]} advertisers The
   *     data to write
   * @param {string} ownAdvertiserId
   * @param {{
   *     sheetName: string,
   *     row: number,
   *     col: number,
   * }=} params
   */
  outputAdvertisers(
    advertisers: GoogleAppsScript.CampaignManager.Advertiser[],
    ownAdvertiserId: string,
    {
      sheetName = CONFIG.advertisers.sheetName,
      row = CONFIG.advertisers.row,
      col = CONFIG.advertisers.col,
    } = {}
  ) {
    const output =
      advertisers.length !== 0
        ? advertisers
            .filter(
              (advertiser: { id: string; name: string }) =>
                advertiser.id !== ownAdvertiserId
            )
            .map(advertiser => [
              advertiser.id,
              `${advertiser.name} (${advertiser.id})`,
            ])
        : [];

    this.getSheetsService().appendToDefinedRange(sheetName, row, col, output);
  }

  /**
   * Load audiences.
   *
   * @param {!Job} job The job instance passed by the jobs infrastructure
   * @param {{
   *     sheetName: string,
   *     row: number,
   *     col: number
   * }=} params
   * @returns {!Job} The modified job instance
   */
  loadAudiences(
    job: Job,
    {
      sheetName = CONFIG.audiences.sheetName,
      row = CONFIG.audiences.row,
      col = CONFIG.audiences.col,
    } = {}
  ) {
    this.getSheetsService().showToast('Loading audiences...', 'Load - BEGIN');

    const remarketingLists =
      this.getCampaignManagerService().getRemarketingLists();

    const customVariables = this.fetchAndOutputCustomVariables();

    const floodlightActivities = this.fetchAndOutputFloodlightActivities();

    const jobs = remarketingLists.map(
      (rl: GoogleAppsScript.CampaignManager.RemarketingList, index: number) => {
        const floodlightId =
          rl.listPopulationRule && rl.listPopulationRule.floodlightActivityId
            ? rl.listPopulationRule.floodlightActivityId
            : '';

        const audience = new Audience({
          id: rl.id,
          name: rl.name,
          description: rl.description || '',
          lifeSpan: Number(rl.lifeSpan) || 90,
          floodlightId,
          floodlightName: this.getFloodlightNameById(
            floodlightId,
            floodlightActivities
          ),
          rules: this.parseAudienceRules(rl, customVariables),
          shares: [],
        });

        return new AudienceLoadJob({
          idx: index,
          audience,
        });
      }
    );

    job.getJobs().push(...jobs);

    // Clear Audiences sheet
    this.getSheetsService().clearDefinedRange(sheetName, row, col);

    return job;
  }

  /**
   * Loads a single audience. Tiggered once for every added audiences from
   * {@link #loadAudiences}.
   *
   * @param {!AudienceLoadJob} job The job instance passed by the jobs infrastructure
   * @param {{
   *     sheetName: string,
   *     row: number,
   *     col: number
   * }=} params
   * @returns {!Job} The modified job instance
   */
  loadAudience(
    job: AudienceLoadJob,
    {
      sheetName = CONFIG.audiences.sheetName,
      row = CONFIG.audiences.row,
      col = CONFIG.audiences.col,
    } = {}
  ) {
    const audience = job.getAudience();
    const sharesRaw =
      this.getCampaignManagerService().getRemarketingListShares(
        audience.getId() ?? ''
      ) ?? [];

    audience.setShares(sharesRaw.map((id: string) => String(id)));

    const audienceRow = audience ? this.audienceToRow(audience) : [];

    // Write audience
    this.getSheetsService().setValuesInDefinedRange(
      sheetName,
      row + job.getIndex(),
      col,
      [audienceRow]
    );

    return job;
  }

  /**
   * Extract rules from audiences and write to Rules sheet.
   * Needs to happen AFTER updating the audiences because of data validation.
   *
   * @param {{
   *     sheetName: string,
   *     row: number,
   *     col: number,
   *     jsonCol: number,
   *     rulesSheetName: string,
   *     rulesRow: string,
   *     rulesCol: string
   * }=} params
   */
  extractAndOutputRules({
    sheetName = CONFIG.audiences.sheetName,
    row = CONFIG.audiences.row,
    col = CONFIG.audiences.col,
    jsonCol = CONFIG.audiences.cols.json,
    rulesSheetName = CONFIG.rules.sheetName,
    rulesRow = CONFIG.rules.row,
    rulesCol = CONFIG.rules.col,
  } = {}) {
    const audiencesRows = this.getSheetsService().getRangeData(
      sheetName,
      row,
      col
    );
    const audiences = audiencesRows.map(audienceRow => {
      const json = JSON.parse(String(audienceRow[jsonCol]));
      return Audience.fromJson(/** @type {!Audience} */ json);
    });

    // Clear Rules sheet
    this.getSheetsService().clearDefinedRange(
      rulesSheetName,
      rulesRow,
      rulesCol
    );

    // Write rules to Sheet
    for (const audience of audiences) {
      this.outputAudienceRules(audience.getId() as string, audience.getRules());
    }
  }

  /**
   * Get Floodlight name by its ID.
   *
   * @param {string} floodlightId The Floodlight ID
   * @param {Array<{ id: string, name: string }>} floodlightActivities The floodlight activities
   * @returns {string}
   */
  getFloodlightNameById(
    floodlightId: string,
    floodlightActivities: Array<{ id: string; name: string }>
  ) {
    const floodlightActivity = floodlightActivities.find(
      fl => fl.id === floodlightId
    );

    return typeof floodlightActivity !== 'undefined'
      ? floodlightActivity.name
      : '';
  }

  /**
   * Get mapped Advertiser IDs.
   *
   * @param {string[]} advertiserIds
   * @param {string=} separator The separator to join the retrieved IDs with
   * @returns {string}
   */
  getMappedShares(
    advertiserIds: string[],
    separator = CONFIG.multiSelect.separator
  ) {
    let output = '';

    if (!advertiserIds || advertiserIds.length === 0) {
      return output;
    }

    const result = advertiserIds.map(advertiserId =>
      this.resolveAdvertiserById(advertiserId)
    );
    result.sort();
    output = result.join(separator);

    return output;
  }

  /**
   * Retrieves Remarketing List Shares for the given remarketing list using
   * {@link #getRemarketingListShares} and prepares the ouput as it should
   * appear in the associated sheet. This method is used as a mapping function
   * for every element of the retrieved Remarketing Lists array in
   * {@link #loadAudience}.
   *
   * @param {!Audience} audience The remarketingList object
   * @param {{
   *     idCol: number,
   *     nameCol: number,
   *     descCol: number,
   *     lifeSpanCol: number,
   *     floodlightIdCol: number,
   *     sharesCol: number,
   *     statusCol: number,
   *     checksumCol: number,
   *     sharesChecksumCol: number,
   *     jsonCol: number
   * }=} params
   * @returns {!Array<string>} The prepared remarketing list row to output in
   *     the associated sheet
   */
  audienceToRow(
    audience: Audience,
    {
      idCol = CONFIG.audiences.cols.id,
      nameCol = CONFIG.audiences.cols.name,
      descCol = CONFIG.audiences.cols.description,
      lifeSpanCol = CONFIG.audiences.cols.lifeSpan,
      floodlightIdCol = CONFIG.audiences.cols.floodlightId,
      sharesCol = CONFIG.audiences.cols.shares,
      statusCol = CONFIG.audiences.cols.status,
      checksumCol = CONFIG.audiences.cols.checksum,
      sharesChecksumCol = CONFIG.audiences.cols.sharesChecksum,
      jsonCol = CONFIG.audiences.cols.json,
    } = {}
  ) {
    const transformedRemarketingList = [];
    transformedRemarketingList[idCol] = audience.getId();
    transformedRemarketingList[nameCol] = audience.getName();
    transformedRemarketingList[descCol] = audience.getDescription();
    transformedRemarketingList[lifeSpanCol] = audience.getLifeSpan();
    transformedRemarketingList[
      floodlightIdCol
    ] = `${audience.getFloodlightName()} (${audience.getFloodlightId()})`;
    transformedRemarketingList[sharesCol] = this.getMappedShares(
      audience.getShares()
    );
    transformedRemarketingList[
      statusCol
    ] = `Fetched (${JobUtil.getCurrentDateString()})`;
    transformedRemarketingList[checksumCol] = audience.getChecksum();
    transformedRemarketingList[sharesChecksumCol] =
      audience.getSharesChecksum();
    transformedRemarketingList[jsonCol] = audience.toJson();

    return transformedRemarketingList;
  }

  /**
   * Get all rules from Sheet.
   *
   * @param {{
   *     sheetName: string,
   *     row: number,
   *     col: number
   * }=} params
   * @returns {!Array<!Array<!Object>>}
   */
  getAllRules({
    sheetName = CONFIG.rules.sheetName,
    row = CONFIG.rules.row,
    col = CONFIG.rules.col,
  } = {}) {
    if (this.rules_.length === 0) {
      this.rules_ =
        this.getSheetsService()
          .getRangeData(sheetName, row, col)
          .filter(rule => rule) || [];
    }

    return this.rules_;
  }

  /**
   * Extract rules from audience.
   *
   * @param {string} audienceId
   * @param {{
   *     audienceIdCol: number,
   *     groupCol: number,
   *     variableCol: number,
   *     operatorCol: number,
   *     valuesCol: number,
   *     negationCol: number,
   *     separator: number
   * }=} params
   * @returns {!Array<!Object>}
   */
  getRules(
    audienceId: string,
    {
      audienceIdCol = CONFIG.rules.cols.audienceId,
      groupCol = CONFIG.rules.cols.group,
      variableCol = CONFIG.rules.cols.variable,
      operatorCol = CONFIG.rules.cols.operator,
      valuesCol = CONFIG.rules.cols.values,
      negationCol = CONFIG.rules.cols.negation,
      separator = CONFIG.customVariables.separator,
    } = {}
  ) {
    const allRules = this.getAllRules().filter(
      rule => String(rule[audienceIdCol]) === audienceId
    );

    const rules = [];

    for (const rule of allRules) {
      const audienceId = String(rule[audienceIdCol]);
      const group = String(rule[groupCol]);
      const name = String(rule[variableCol]).split(separator, 1)[0];
      const operator = String(rule[operatorCol]);
      const value = String(rule[valuesCol]);
      const negation = rule[negationCol];

      if (name && operator && value) {
        rules.push({
          audienceId,
          group,
          name,
          type: 'CUSTOM_VARIABLE_TERM',
          operator,
          value,
          negation,
        });
      }
    }

    return rules;
  }

  /**
   * Parse Audience rules from Remarketing List.
   *
   * @param {!Object} remarketingList
   * @param {!Array<!Object>} customVariables
   *
   * @returns {!Array<!Object>}
   */
  parseAudienceRules(
    remarketingList: GoogleAppsScript.CampaignManager.RemarketingList,
    customVariables: GoogleAppsScript.CampaignManager.UserDefinedVariableConfiguration[]
  ) {
    let index = 0;
    const clauses =
      remarketingList?.listPopulationRule?.listPopulationClauses ?? [];
    const rules = [];

    for (const clause of clauses) {
      if (!clause?.terms) continue;

      for (const term of clause.terms) {
        const variableFriendlyName = (
          customVariables.find(
            variable =>
              variable.variableType.toLowerCase() ===
              term.variableName.toLowerCase()
          ) as GoogleAppsScript.CampaignManager.UserDefinedVariableConfiguration
        ).reportName;

        rules.push({
          group: index,
          variableName: term.variableName,
          variableFriendlyName,
          operator: term.operator,
          value: term.value,
          negation: term.negation,
        });
      }

      index += 1;
    }

    return rules;
  }

  /**
   * Output audience rules.
   *
   * @param {string} audienceId
   * @param {AudienceRule[]} rules
   * @param {{
   *     sheetName: string,
   *     row: number,
   *     col: number,
   *     audienceIdCol: number,
   *     groupCol: number,
   *     variableCol: number,
   *     operatorCol: number,
   *     valuesCol: number,
   *     negationCol: number,
   *     separator: number
   * }=} params
   */
  outputAudienceRules(
    audienceId: string,
    rules: AudienceRule[],
    {
      sheetName = CONFIG.rules.sheetName,
      row = CONFIG.rules.row,
      col = CONFIG.rules.col,
      audienceIdCol = CONFIG.rules.cols.audienceId,
      groupCol = CONFIG.rules.cols.group,
      variableCol = CONFIG.rules.cols.variable,
      operatorCol = CONFIG.rules.cols.operator,
      valuesCol = CONFIG.rules.cols.values,
      negationCol = CONFIG.rules.cols.negation,
      separator = CONFIG.customVariables.separator,
    } = {}
  ) {
    if (rules.length === 0) {
      return;
    }

    const rows = rules.map(rule => {
      const res = [];
      res[audienceIdCol] = audienceId;
      res[groupCol] = rule.group;
      res[
        variableCol
      ] = `${rule.variableName}${separator}${rule.variableFriendlyName}`;
      res[operatorCol] = rule.operator;
      res[valuesCol] = rule.value;
      res[negationCol] = rule.negation;

      return res;
    });

    this.getSheetsService().appendToDefinedRange(sheetName, row, col, rows);
  }

  /**
   * Creates a valid ListPopulationRule object from audience rules.
   *
   * @param {string | undefined} floodlightId
   * @param {AudienceRule[]} audienceRules
   * @param {{
   *     termType: string,
   *     separator: number
   * }=} params
   * @returns {!Object}
   */
  createListPopulationRuleFromRules(
    floodlightId: string | undefined,
    audienceRules: AudienceRule[],
    {
      termType = CONFIG.rules.termType,
      separator = CONFIG.rules.separator,
    } = {}
  ) {
    const allTerms: GoogleAppsScript.CampaignManager.ListPopulationTerm[][] =
      [];

    for (const rule of audienceRules) {
      const terms = rule.value.split(separator).map(val => {
        return {
          variableName: rule.variableName,
          type: termType,
          operator: rule.operator,
          value: val,
          negation: rule.negation,
        };
      });

      if (allTerms[rule.group]) {
        allTerms[rule.group] = allTerms[rule.group]
          .concat(terms)
          .flatMap(x => x);
      } else {
        allTerms[rule.group] = terms;
      }
    }

    const listPopulationClauses = [];

    for (const terms of allTerms) {
      listPopulationClauses.push({
        terms,
      });
    }

    const listPopulationRule: GoogleAppsScript.CampaignManager.ListPopulationRule =
      {
        floodlightActivityId: floodlightId,
      };

    if (listPopulationClauses.length > 0) {
      listPopulationRule.listPopulationClauses = listPopulationClauses;
    }

    return listPopulationRule;
  }

  /**
   * Resolves an advertiser ID to its associated name by reading the ID - Name
   * mappings from the underlying spreadsheet and filtering for the given ID.
   *
   * @param {string} advertiserId The advertiserId to resolve
   * @param {{
   *     sheetName: string,
   *     row: number,
   *     col: number,
   *     defaultName: string,
   *     idCol: number,
   *     nameCol: number
   * }=} params
   * @returns {string} The name of the matched advertiser
   */
  resolveAdvertiserById(
    advertiserId: string,
    {
      sheetName = CONFIG.advertisers.sheetName,
      row = CONFIG.advertisers.row,
      col = CONFIG.advertisers.col,
      defaultName = CONFIG.advertisers.defaultName,
      idCol = CONFIG.advertisers.cols.id,
      nameCol = CONFIG.advertisers.cols.name,
    } = {}
  ) {
    const data = this.getSheetsService().getRangeData(sheetName, row, col);
    const result = data.filter(
      advertiser => String(advertiser[idCol]) === advertiserId
    );

    return result.length === 0 ? defaultName : String(result[0][nameCol]);
  }

  /**
   * Returns the SheetsService instance.
   *
   * @returns {!SheetsService} The SheetsService instance
   */
  getSheetsService() {
    return this.sheetsService_;
  }

  /**
   * Returns the CampaignManagerFacade instance.
   *
   * @returns {!CampaignManagerFacade} The CampaignManagerFacade instance
   */
  getCampaignManagerService() {
    return this.campaignManagerService_;
  }
}
