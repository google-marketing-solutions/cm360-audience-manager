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

/** @type {?Logger} */
let logger = null;

/** @type {?AudiencesController} */
let audiencesController = null;

/** @type {?AudienceUpdateJobController} */
let audienceUpdateJobController = null;

/** @type {?AudienceCreateJobController} */
let audienceCreateJobController = null;

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
 * @return {{networkId: string, advertiserId: string}} A JS object containing
 *     the CM360 Network and Advertiser ID
 */
function getClientAccountConfiguration() {
  const networkId = getSheetsService().getCellValue(
      CONFIG.accountData.sheetName,
      CONFIG.accountData.networkId.row,
      CONFIG.accountData.networkId.col);
  const advertiserId = getSheetsService().getCellValue(
      CONFIG.accountData.sheetName,
      CONFIG.accountData.advertiserId.row,
      CONFIG.accountData.advertiserId.col);

  return {
    networkId: networkId.toString(),
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

/** Retrieves configured audience lists from the logged in user's account. */
function getAudiences() {
  getAudiencesController().fetchAndOutputRemarketingLists();
}

/**
 * Clears all logs from the log sheet.
 *
 * @param {!Job} job The job object that is provided by the infrastructure. In
 *     this case it doesn't include any additional relevant information
 * @return {!Job} The input job object
 */
function clearLogs(job) {
  return getLogger().clearLogs(job);
}

/**
 * Extracts logs from the given jobs then and writes them to the log sheet.
 *
 * @param {!Job} job The job wrapper which contains jobs with log messages to
 *     write and the offset to write them at
 * @return {!Job} The modified input job wrapper
 */
function writeLogs(job) {
  return getLogger().writeLogs(job);
}

/**
 * Identifies and updates audiences changed in the underlying spreadsheet.
 * @see jobs.js#updateAudiencesJob
 *
 * @param {!Job} job The job instance passed by the jobs infrastructure
 * @return {!Job} The modified job instance
 */
function updateAudiences(job) {
  return getAudienceUpdateJobController().updateAudiences(job);
}

/**
 * Updates all audience specified in the underlying spreadsheet.
 * @see jobs.js#updateAllAudiencesJob
 *
 * @param {!Job} job The job instance passed by the jobs infrastructure
 * @return {!Job} The modified job instance
 */
function updateAllAudiences(job) {
  return getAudienceUpdateJobController()
      .updateAudiences(job, /* updateAll= */ true);
}

/**
 * Updates a single audience. Triggered once for every changed audience from
 * {@link #updateAudiences} or {@link #updateAllAudiences}.
 * @see jobs.js#updateAudienceJob
 *
 * @param {!AudienceUpdateJob} job The job instance passed by the jobs
 *     infrastructure
 * @return {!AudienceUpdateJob} The job instance
 */
function updateAudience(job) {
  return getAudienceUpdateJobController().updateAudience(job);
}

/**
 * Identifies and updates audiences added to the underlying spreadsheet.
 * @see jobs.js#createAudiencesJob
 *
 * @param {!Job} job The job instance passed by the jobs infrastructure
 * @return {!Job} The modified job instance
 */
function createAudiences(job) {
  return getAudienceCreateJobController().createAudiences(job);
}

/**
 * Creates a single audience. Triggered once for every added audience from
 * {@link #createAudiences}.
 * @see jobs.js#createAudienceJob
 *
 * @param {!AudienceCreateJob} job The job instance passed by the jobs
 *     infrastructure
 * @return {!AudienceCreateJob} The job instance
 */
function createAudience(job) {
  return getAudienceCreateJobController().createAudience(job);
}

/**
 * Returns the SheetsService instance, initializing it if it does not exist yet.
 *
 * @return {!SheetsService} The initialized SheetsService instance
 */
function getSheetsService() {
  if (sheetsService == null) {
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
  if (campaignManagerService == null) {
    campaignManagerService = new CampaignManagerFacade(
        getClientAccountConfiguration(),
        CONFIG.apiFirst);
  }
  return campaignManagerService;
}

/**
 * Returns the Logger instance, initializing it if it does not exist yet.
 *
 * @return {!Logger} The initialized Logger instance
 */
function getLogger() {
  if (logger == null) {
    logger = new Logger(getSheetsService());
  }
  return logger;
}

/**
 * Returns the AudiencesController instance, initializing it if it does not
 * exist yet.
 *
 * @return {!AudiencesController} The initialized AudiencesController
 *     instance
 */
function getAudiencesController() {
  if (audiencesController == null) {
    audiencesController = new AudiencesController(
        getSheetsService(), getCampaignManagerService());
  }
  return audiencesController;
}

/**
 * Returns the AudienceUpdateJobController instance, initializing it if it does
 * not exist yet.
 *
 * @return {!AudienceUpdateJobController} The initialized
 *     AudienceUpdateJobController instance
 */
function getAudienceUpdateJobController() {
  if (audienceUpdateJobController == null) {
    audienceUpdateJobController = new AudienceUpdateJobController(
        getSheetsService(), getCampaignManagerService());
  }
  return audienceUpdateJobController;
}

/**
 * Returns the AudienceCreateJobController instance, initializing it if it does
 * not exist yet.
 *
 * @return {!AudienceCreateJobController} The initialized
 *     AudienceCreateJobController instance
 */
function getAudienceCreateJobController() {
  if (audienceCreateJobController == null) {
    audienceCreateJobController = new AudienceCreateJobController(
        getSheetsService(), getCampaignManagerService());
  }
  return audienceCreateJobController;
}
