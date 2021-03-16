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
 * @fileoverview This file encapsulates all logic for creating and manipulating
 * audiences defined in the associated Google Sheets spreadsheet.
 */


/**
 * @class AudiencesController representing a class for holding all logic for
 * creating and manipulating audiences.
 */
class AudiencesController {
  /**
   * @constructs an instance of AudiencesController.
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
   * Retrieves user defined variable configurations for the logged in user and
   * CM360 Network and writes them to the associated sheet.
   *
   * @param {{
   *     sheetName: string,
   *     row: number,
   *     col: number,
   * }=} params
   */
  fetchAndOutputCustomVariables({
      sheetName = CONFIG.customVariables.sheetName,
      row = CONFIG.customVariables.row,
      col = CONFIG.customVariables.col} = {}) {
    this.getSheetsService().clearDefinedRange(sheetName, row, col);

    const data = this.getCampaignManagerService()
        .getUserDefinedVariableConfigurations();

    const output = data.map((v) => `${v.variableType}:${v.reportName}`);
    this.getSheetsService()
        .setValuesInDefinedRange(sheetName, row, col, [output]);
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
   */
  fetchAndOutputFloodlightActivities({
      sheetName = CONFIG.floodlights.sheetName,
      row = CONFIG.floodlights.row,
      col = CONFIG.floodlights.col} = {}) {
    this.getSheetsService().clearDefinedRange(sheetName, row, col);

    const data = this.getCampaignManagerService()
        .getFloodlightActivities();

    const output = data.length !== 0 ? data.map((element) => [
      element.id,
      `${element.name} (${element.id})`,
    ]) : [[]];
    this.getSheetsService()
        .setValuesInDefinedRange(sheetName, row, col, output);
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
   * }=} params
   */
  fetchAndOutputAdvertisers({
      sheetName = CONFIG.advertisers.sheetName,
      row = CONFIG.advertisers.row,
      col = CONFIG.advertisers.col,
      maxResultsPerPage = CONFIG.advertisers.maxResultsPerPage} = {}) {
    this.getSheetsService().clearDefinedRange(sheetName, row, col);

    const callback = (data) => {
      this.outputAdvertisers(data);
    };

    this.getCampaignManagerService()
        .getAdvertisers(maxResultsPerPage, callback);
  }

  /**
   * Delegates to {@link SheetsService} to write the given data to the
   * associated spreadsheet. Used as a callback within
   * {@link #fetchAndOutputAdvertisers}.
   *
   * @param {{advertisers: !Array<!Object>, nextPageToken: string}} data The
   *     data to write
   * @param {string=} sheetName The name of the sheet to use
   * @param {number=} row The start row to write data at
   * @param {number=} col The start col to write data at
   */
  outputAdvertisers(
      data,
      sheetName = CONFIG.advertisers.sheetName,
      row = CONFIG.advertisers.row,
      col = CONFIG.advertisers.col) {
    const output = data.advertisers.length !== 0 ?
        data.advertisers.map((advertiser) => [
          advertiser.id,
          `${advertiser.name} (${advertiser.id})`,
        ]) : [[]];
    this.getSheetsService().appendToDefinedRange(sheetName, row, col, output);
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

