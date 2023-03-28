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
import { AudienceProcessJob } from '../model/audienceProcessJob';
import { Job } from '../model/job';
import { type SheetsService } from '../service/sheets';
import { JobUtil } from '../util/job';

/**
 * @fileoverview This file encapsulates all logic for creating audiences defined
 * in the associated Google Sheets spreadsheet.
 */

/**
 * AudienceCreateJobController representing a class for holding all logic
 * for handling create audience jobs triggered by the underlying jobs
 * infrastructure.
 */
export class AudienceProcessJobController {
  private readonly sheetsService_: SheetsService;
  private readonly campaignManagerService_: CampaignManagerFacade;
  rules_: Array<Array<string | number | boolean>>;
  /**
   * @constructs an instance of AudienceProcessJobController.
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
   * Processes audiences from the underlying spreadsheet.
   *
   * @param {!Job} job The job instance passed by the jobs infrastructure
   * @param {{
   *     sheetName: string,
   *     row: number,
   *     col: number,
   *     nameCol: number,
   * }=} params
   * @returns {!Job} The modified job instance
   */
  processAudiences(
    job: Job,
    {
      sheetName = CONFIG.audiences.sheetName,
      row = CONFIG.audiences.row,
      col = CONFIG.audiences.col,
      nameCol = CONFIG.audiences.cols.name,
    } = {}
  ) {
    this.getSheetsService().showToast('Processing audiences...', 'Process');

    const audiences = this.getSheetsService().getRangeData(sheetName, row, col);

    const jobs: Job[] = audiences
      // Add row index
      .map((audience: string[], index: number) =>
        audience.concat(String(index))
      )
      // Remove invalid audiences
      .filter(
        (audience: string[]) => audience.length > 1 && String(audience[nameCol])
      )
      // Create jobs
      .map((audience: string[]) => this.createAudienceProcessJob(audience))
      .filter(
        (audienceJob): audienceJob is AudienceProcessJob =>
          !(audienceJob === undefined)
      );
    job.getJobs().push(...jobs);

    return job;
  }

  /**
   * Creates an {@link AudienceProcessJob} instance for the given audience data.
   *
   * @param {?Array<?Object>} audienceRow The audience row of data from the
   *     underlying sheet
   * @param {{
   *     idCol: string,
   *     nameCol: number,
   *     lifeSpanCol: number,
   *     descriptionCol: number,
   *     floodlightIdCol: number,
   *     sharesCol: number,
   *     checksumCol: number,
   *     sharesChecksumCol: number,
   *     createAudienceAction: string,
   *     updateAudienceAction: string,
   *     updateSharesAction: string
   * }=} params
   * @returns {!AudienceProcessJob|undefined} The created AudienceProcessJob instance
   */
  createAudienceProcessJob(
    audienceRow: Array<string | number>,
    {
      idCol = CONFIG.audiences.cols.id,
      nameCol = CONFIG.audiences.cols.name,
      lifeSpanCol = CONFIG.audiences.cols.lifeSpan,
      descriptionCol = CONFIG.audiences.cols.description,
      floodlightIdCol = CONFIG.audiences.cols.floodlightId,
      sharesCol = CONFIG.audiences.cols.shares,
      checksumCol = CONFIG.audiences.cols.checksum,
      sharesChecksumCol = CONFIG.audiences.cols.sharesChecksum,
      createAudienceAction = CONFIG.audiences.actions.create,
      updateAudienceAction = CONFIG.audiences.actions.update,
      updateSharesAction = CONFIG.audiences.actions.updateShares,
    } = {}
  ) {
    const audienceName = String(audienceRow[nameCol]);
    const idx = Number(audienceRow[audienceRow.length - 1]);

    const audienceRules = this.getAudienceRules(String(audienceRow[idCol]));

    const audience = new Audience({
      id: String(audienceRow[idCol]),
      name: audienceName,
      description: String(audienceRow[descriptionCol]),
      lifeSpan: Number(audienceRow[lifeSpanCol]),
      floodlightId: this.extractFloodlightId(
        String(audienceRow[floodlightIdCol])
      ),
      rules: audienceRules,
      shares: this.extractSharedAdvertiserIds(String(audienceRow[sharesCol])),
    });

    const actions = [];

    if (!audienceRow[checksumCol]) {
      actions.push(createAudienceAction);
    } else if (String(audienceRow[checksumCol]) !== audience.getChecksum()) {
      actions.push(updateAudienceAction);
    }

    if (
      String(audienceRow[sharesChecksumCol]) !== audience.getSharesChecksum()
    ) {
      actions.push(updateSharesAction);
    }

    const audienceProcessJob = new AudienceProcessJob({
      idx,
      audience,
      actions,
    });

    return actions.length > 0 ? audienceProcessJob : undefined;
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
   * @returns {string|undefined} The extracted floodlightId as a string, or
   *     undefined if the input string was empty or did not match the regex
   */
  extractFloodlightId(
    idAndNameString: string,
    regex = CONFIG.floodlights.idAndNameRegex
  ) {
    const regexp = new RegExp(regex, 'g');
    const matches = idAndNameString.matchAll(regexp);
    let result;

    for (const match of matches) {
      const res = match.toString().split(',');
      result = String(res[1]);
    }

    return result;
  }

  /**
   * Get all rules.
   *
   * @param {{
   *     sheetName: string,
   *     row: number,
   *     col: number
   * }=} params
   *
   * @returns {?Array<string | number | boolean>}
   */
  getAllRules({
    sheetName = CONFIG.rules.sheetName,
    row = CONFIG.rules.row,
    col = CONFIG.rules.col,
  } = {}): (string | number | boolean)[][] {
    if (this.rules_.length === 0) {
      this.rules_ = this.getSheetsService()
        .getRangeData(sheetName, row, col)
        .filter((rule: string[]) => rule.length);
    }

    return this.rules_;
  }

  /**
   * Creates audience rules for the given audience.
   *
   * @param {string} audienceId The audience ID
   * @param {{
   *     audienceIdCol: number,
   *     groupCol: number,
   *     variableCol: number,
   *     operatorCol: number,
   *     valuesCol: number,
   *     negationCol: number,
   *     separator: number,
   * }=} params
   * @returns {!Array<AudienceRule>} The created audience rules
   */
  getAudienceRules(
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
    const rules: AudienceRule[] = [];

    const allRules = this.getAllRules().filter(
      rule => rule[audienceIdCol] === audienceId
    );

    for (const rule of allRules) {
      const group = Number(rule[groupCol]) || 0;
      const variable = String(rule[variableCol]).split(separator);
      const operator = String(rule[operatorCol]);
      const value = String(rule[valuesCol]) || '';
      const negation = String(rule[negationCol]) === 'true';

      if (variable && operator && value) {
        rules.push({
          group,
          variableName: variable[0],
          variableFriendlyName: variable[1],
          operator,
          value,
          negation,
        });
      }
    }

    return rules;
  }

  /**
   * Processes a single audience. Tiggered once for every added audiences from
   * {@link #processAudiences}.
   *
   * @param {!AudienceProcessJob} job The job instance passed by the jobs
   *     infrastructure
   * @param {{
   *     sheetName: string,
   *     row: number,
   *     idCol: number,
   *     statusCol: number,
   *     checksumCol: number,
   *     sharesChecksumCol: number,
   *     defaultState: boolean,
   *     listSource: string,
   *     createAudienceAction: string,
   *     updateAudienceAction: string,
   *     updateSharesAction: string,
   *     rulesSheetName: string
   * }=} params
   * @returns {!AudienceProcessJob} The job instance
   */
  processAudience(
    job: AudienceProcessJob,
    {
      sheetName = CONFIG.audiences.sheetName,
      row = CONFIG.audiences.row,
      idCol = CONFIG.audiences.cols.id,
      statusCol = CONFIG.audiences.cols.status,
      checksumCol = CONFIG.audiences.cols.checksum,
      sharesChecksumCol = CONFIG.audiences.cols.sharesChecksum,
      defaultState = CONFIG.audiences.defaultState,
      listSource = CONFIG.audiences.listSource,
      createAudienceAction = CONFIG.audiences.actions.create,
      updateAudienceAction = CONFIG.audiences.actions.update,
      updateSharesAction = CONFIG.audiences.actions.updateShares,
      rulesSheetName = CONFIG.rules.sheetName,
    } = {}
  ) {
    console.log(
      `Processing audience '${job.getAudience().getName()}'...`,
      job.getAudience().getId()
    );

    const listPopulationRule = this.createListPopulationRule(
      job.getAudience().getFloodlightId(),
      job.getAudience().getRules()
    );

    const remarketingList: GoogleAppsScript.CampaignManager.RemarketingList = {
      name: job.getAudience().getName(),
      description: job.getAudience().getDescription(),
      lifeSpan: job.getAudience().getLifeSpan(),
      listPopulationRule,
      active: defaultState,
      listSource,
    };

    let status;

    try {
      let result: GoogleAppsScript.CampaignManager.RemarketingList;

      if (job.getActions().includes(updateAudienceAction)) {
        console.log(`Updating '${job.getAudience().getName()}'...`);
        remarketingList.id = job.getAudience().getId();
        result =
          this.getCampaignManagerService().updateRemarketingList(
            remarketingList
          );
      } else if (job.getActions().includes(createAudienceAction)) {
        console.log(`Creating '${job.getAudience().getName()}'...`);
        result =
          this.getCampaignManagerService().createRemarketingList(
            remarketingList
          );

        if (!result) {
          throw new Error('Error creating audience');
        }

        // Update Audience ID in Sheet
        this.getSheetsService().setCellValue(
          row + job.getIndex(),
          idCol + 1,
          result.id as string,
          sheetName
        );

        // Update Audience ID for Rules
        this.getSheetsService().findAndReplace(
          rulesSheetName,
          job.getAudience().getId() as string,
          result.id as string
        );

        // Update Audience ID
        job.getAudience().setId(result.id as string);
      }

      // Update Advertiser Shares
      if (job.getActions().includes(updateSharesAction)) {
        console.log(`Updating Shares for '${job.getAudience().getName()}'...`);

        const remarketingListSharesResource =
          this.getCampaignManagerService().getRemarketingListSharesResource(
            job.getAudience().getId() as string
          );

        // Update Advertiser IDs in ShareResource
        remarketingListSharesResource.sharedAdvertiserIds = job
          .getAudience()
          .getShares();

        // Push update
        this.getCampaignManagerService().updateRemarketingListShares(
          job.getAudience().getId() as string,
          remarketingListSharesResource
        );

        // Update Shares checksum in Sheet
        this.getSheetsService().setCellValue(
          row + job.getIndex(),
          sharesChecksumCol + 1,
          job.getAudience().getSharesChecksum(),
          sheetName
        );
      }

      // Update Audience checksum in Sheet
      this.getSheetsService().setCellValue(
        row + job.getIndex(),
        checksumCol + 1,
        job.getAudience().getChecksum(),
        sheetName
      );

      status = `Success (${JobUtil.getCurrentDateString()})`;

      const message = `Processed audience '${job
        .getAudience()
        .getName()}' successfully!`;
      console.log(message);
      job.log([message]);
    } catch (err: unknown) {
      const error = err as Error;
      console.log('ERROR', JSON.stringify(error));
      status = `Error! ${error.message} (${JobUtil.getCurrentDateString()})`;

      const message = `Error while processing audience '${job
        .getAudience()
        .getName()}'!`;
      console.log(message);
      job.log([message]);
    }

    // Update status in Sheet
    this.getSheetsService().setCellValue(
      row + job.getIndex(),
      statusCol + 1,
      status,
      sheetName
    );

    return job;
  }

  /**
   * Create the List Population Rule object of the remarketing list that will
   * be created based on the provided audience rules from the underlying
   * spreadsheet.
   *
   * @param {string|undefined} floodlightId The floodlight ID
   * @param {!Array<{
   *         group: number,
   *         variableName: string,
   *         variableFriendlyName: string,
   *         operator: string,
   *         value: string,
   *         negation: boolean,
   *     }>} audienceRules The audience rules
   * @param {{
   *     termType: string,
   *     separator: string,
   * }=} params
   * @returns {{
   *     floodlightActivityId: (string|undefined),
   *     listPopulationClauses: (!Array<{terms: !Array<!Object>}>|undefined),
   * }} The created list population rule object
   */
  createListPopulationRule(
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
   * Extracts advertiser IDs from the given cell value. The given value is in
   * the format 'name (id)##name (id)' where ## is the separator specified in
   * {@link globals.js}.
   *
   * @param {string} audienceListSharesRaw The raw audienceListShares from the
   *     underlying spreadsheet
   * @param {string=} separatorRegex The regex to use. Defaults to the config in
   *     globals.js
   * @returns {!string[]} An array of all extracted advertiser IDs
   */
  extractSharedAdvertiserIds(
    audienceListSharesRaw: string,
    separatorRegex = CONFIG.multiSelect.separatorRegex
  ) {
    const regex = new RegExp(separatorRegex, 'g');
    const matches = audienceListSharesRaw.matchAll(regex);
    const result = [];

    for (const match of matches) {
      const res = match.toString().split(',');
      result.push(String(res[1]));
    }
    return result;
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
