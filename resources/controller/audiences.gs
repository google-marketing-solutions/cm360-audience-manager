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
   *     separator: string,
   * }=} params
   */
  fetchAndOutputCustomVariables({
      sheetName = CONFIG.customVariables.sheetName,
      row = CONFIG.customVariables.row,
      col = CONFIG.customVariables.col,
      separator = CONFIG.customVariables.separator} = {}) {
    this.getSheetsService().clearDefinedRange(sheetName, row, col);

    const data = this.getCampaignManagerService()
        .getUserDefinedVariableConfigurations();

    const output = data.length !== 0 ?
        data.map((v) => [`${v.variableType}${separator}${v.reportName}`]) :
        [[]];
    this.getSheetsService()
        .setValuesInDefinedRange(sheetName, row, col, output);
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
   * @param {{
   *     sheetName: string,
   *     row: number,
   *     col: number,
   * }=} params
   */
  outputAdvertisers(data, {
      sheetName = CONFIG.advertisers.sheetName,
      row = CONFIG.advertisers.row,
      col = CONFIG.advertisers.col} = {}) {
    const output = data.advertisers.length !== 0 ?
        data.advertisers.map((advertiser) => [
          advertiser.id,
          `${advertiser.name} (${advertiser.id})`,
        ]) : [[]];
    this.getSheetsService().appendToDefinedRange(sheetName, row, col, output);
  }

  /**
   * Retrieves Remarketing Lists belonging to the given Advertiser and CM360
   * Network and writes them to the associated sheet.
   *
   * @param {{
   *     sheetName: string,
   *     row: number,
   *     col: number,
   * }=} params
   */
  fetchAndOutputRemarketingLists({
      sheetName = CONFIG.audiences.update.sheetName,
      row = CONFIG.audiences.update.row,
      col = CONFIG.audiences.update.col} = {}) {
    this.getSheetsService().showToast(
        /* message= */ 'Fetching audiences...',
        /* title= */ 'Update - BEGIN');

    const remarketingLists = this.getCampaignManagerService()
        .getRemarketingLists();
    const filteredRemarketingLists = remarketingLists
        .filter((remarketingList) => remarketingList.listPopulationRule);

    const output = filteredRemarketingLists.length !== 0 ?
        filteredRemarketingLists.map((list) =>
          this.prepareRemarketingList(list)) :
        [[]];

    this.getSheetsService().clearDefinedRange(sheetName, row, col);
    this.getSheetsService()
        .setValuesInDefinedRange(sheetName, row, col, output);
    this.getSheetsService().showToast(
        /* message= */ 'Audiences fetched successfully!',
        /* title= */ 'Update - END',
        /* timeoutSeconds= */ 5);
  }

  /**
   * Retrieves Remarketing List Shares for the given remarketing list using
   * {@link #getRemarketingListShares} and prepares the ouput as it should
   * appear in the associated sheet. This method is used as a mapping function
   * for every element of the retrieved Remarketing Lists array in
   * {@link #fetchAndOutputRemarketingLists}.
   *
   * @param {!Object} remarketingList The remarketingList object
   * @param {string=} status The default status to set per remarketing list
   * @return {!Array<string>} The prepared remarketing list row to output in
   *     the associated sheet
   */
  prepareRemarketingList(
      remarketingList,
      status = CONFIG.multiSelect.modificationStatus.values.read) {
    const remarketingListShares =
        this.getRemarketingListShares(remarketingList.id);

    return [
      remarketingList.id,
      remarketingList.name,
      remarketingList.name,
      remarketingList.description,
      JSON.stringify(remarketingList.listPopulationRule),
      remarketingList.lifeSpan,
      remarketingList.listSize,
      remarketingListShares,
      status,
    ];
  }

  /**
   * Retrieves Remarketing List Shares, which are advertisers Ids that the
   * associated remarketing list is allowed to be shared with, and formats them
   * according to how they should appear in the associated sheet.
   *
   * @param {string} remarketingListId The remarketing list ID
   * @param {string=} separator The separator to join the retrieved IDs with
   * @return {string} A string representing the joined retrieved IDs, or an
   *     empty string if no IDs were retrieved
   */
  getRemarketingListShares(
      remarketingListId,
      separator = CONFIG.multiSelect.separator) {
    const remarketingListShares = this.getCampaignManagerService()
        .getRemarketingListShares(remarketingListId);
    let output = '';

    if (remarketingListShares.length !== 0) {
      const result = remarketingListShares.map((advertiserId) =>
        this.resolveAdvertiserById(advertiserId));
      result.sort();
      output = result.join(separator);
    }
    return output;
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
   * }=} params
   * @return {string} The name of the matched advertiser
   */
  resolveAdvertiserById(advertiserId, {
      sheetName = CONFIG.advertisers.sheetName,
      row = CONFIG.advertisers.row,
      col = CONFIG.advertisers.col,
      defaultName = CONFIG.advertisers.defaultName} = {}) {
    const data = this.getSheetsService().getRangeData(sheetName, row, col);
    const result = data
        .filter((mapping) => String(mapping[0]) === advertiserId);

    return result.length === 0 ? defaultName : String(result[0][1]);
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

