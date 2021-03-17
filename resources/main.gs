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
 * @fileoverview This Google Apps Script file contains methods representing the
 * main entry and interaction points with the associated Google Spreadsheet.
 * The methods here delegate to the {@link SheetsApi} and
 * {@link CampaignManagerApi} classes for Sheets and Campaign Manager related
 * functionality respectively.
 */


/** @type {?SheetsService} */
let sheetsService = null;

/** @type {?CampaignManagerFacade} */
let campaignManagerService = null;

/** @type {?AudiencesController} */
let audiencesController = null;

/**
 * Creates a new menu in Google Sheets that contains different methods for
 * retrieving and updating Campaign Manager audience lists.
 */
function onOpen() {
  const ui = getSheetsService().getSpreadsheetApp().getUi();

  ui.createMenu('Audience Bulk Editor')
      .addItem('Request Access', 'requestAccess')
      .addSubMenu(ui.createMenu('Create Audiences')
                  .addItem('1. Get Custom Variables', 'getCustomVariables')
                  .addItem('2. Get Floodlight Activities', 'getFloodlights')
                  .addItem('3. Create New Audiences', 'showAudiencesSidebar'))
      .addSubMenu(ui.createMenu('Update Audiences')
                  .addItem('1. Fetch Advertisers', 'getAdvertisers')
                  .addItem('2. Fetch Existing Audiences', 'getAudiences')
                  .addItem('3. Update Audiences', 'showAudiencesSidebar'))
      .addSubMenu(ui.createMenu('Utils')
                  .addItem('Multi-select for current cell',
                           'showMultiSelectSidebar'))
      .addToUi();
}

/**
 * Triggers a request through the {@link CampaignManagerService} to prompt the
 * user to authenticate themselves if not already done through the instructions
 * in the associated Google Sheets spreadsheet.
 */
function requestAccess() {
  getCampaignManagerService().getUserProfileId();
}

/**
 * Retrieves client account configuration referenced in the associated Google
 * Sheets spreadsheet.
 *
 * @return {{cmNetwork: string, advertiserId: string}} A JS object containing
 *     the CM360 Network and Advertiser ID
 */
function getClientAccountConfiguration() {
  const cmNetwork = getSheetsService().getCellValue(
      CONFIG.accountData.sheetName,
      CONFIG.accountData.cmNetwork.row,
      CONFIG.accountData.cmNetwork.col);
  const advertiserId = getSheetsService().getCellValue(
      CONFIG.accountData.sheetName,
      CONFIG.accountData.advertiserId.row,
      CONFIG.accountData.advertiserId.col);

  return {
    cmNetwork: cmNetwork.toString(),
    advertiserId: advertiserId.toString(),
  };
}

/**
 * Retrieves customer variables defined in the floodlight configuration settings
 * of the logged in user's account.
 */
function getCustomVariables() {
  getAudiencesController().fetchAndOutputCustomVariables();
}

/**
 * Retrieves configured floodlight activities from the logged in user's account.
 */
function getFloodlights() {
  getAudiencesController().fetchAndOutputFloodlightActivities();
}

/** Retrieves advertisers from the logged in user's CM360 account. */
function getAdvertisers() {
  getAudiencesController().fetchAndOutputAdvertisers();
}

/**
 * Retrieves configured audience lists from the logged in user's account.
 */
function getAudiences() {
  getAudiencesController().fetchAndOutputRemarketingLists();
}

/**
 * Returns the SheetsService instance, initializing it if it does not exist yet.
 *
 * @return {!SheetsService} The initialized SheetsService instance
 */
function getSheetsService() {
  if (!sheetsService) {
    sheetsService = new SheetsService();
  }
  return sheetsService;
}

/**
 * Returns the CampaignManagerFacade instance, initializing it if it does not
 * exist yet.
 *
 * @return {!CampaignManagerFacade} The initialized CampaignManagerFacade
 *     instance
 */
function getCampaignManagerService() {
  if (!campaignManagerService) {
    campaignManagerService = new CampaignManagerFacade(
        getClientAccountConfiguration(),
        CONFIG.apiFirst);
  }
  return campaignManagerService;
}

/**
 * Returns the AudiencesController instance, initializing it if it does not
 * exist yet.
 *
 * @return {!AudiencesController} The initialized AudiencesController
 *     instance
 */
function getAudiencesController() {
  if (!audiencesController) {
    audiencesController = new AudiencesController(
        getSheetsService(), getCampaignManagerService());
  }
  return audiencesController;
}
