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

import { AudienceProcessJobController } from './controller/audienceProcessJob';
import { AudiencesController } from './controller/audiences';
import { CampaignManagerFacade } from './facade/cm360';
import { CONFIG } from './config';
import { SheetsService } from './service/sheets';
import { CustomLogger } from './util/logger';
import { AudienceLoadJob } from './model/audienceLoadJob';
import { AudienceProcessJob } from './model/audienceProcessJob';
import { Job } from './model/job';
import { keepMultiselect } from './util/multiselect';
import { keepJobs } from './util/jobs';

/**
 * @fileoverview This Google Apps Script file contains methods representing the
 * main entry and interaction points with the associated Google Spreadsheet.
 * The methods here delegate to the {@link SheetsApi} and
 * {@link CampaignManagerApi} classes for Sheets and Campaign Manager related
 * functionality respectively.
 */

keepMultiselect;
keepJobs;

let campaignManagerService: CampaignManagerFacade;
let logger: CustomLogger;
let audiencesController: AudiencesController;
let audienceProcessJobController: AudienceProcessJobController;

/**
 * Extract rules from audiences and write to Rules sheet.
 */
function extractAndOutputRules() {
  getAudiencesController().extractAndOutputRules();
}

/**
 * Creates a new menu in Google Sheets that contains different methods for
 * retrieving and updating Campaign Manager audience lists.
 */
function onOpen() {
  const ui = SheetsService.getInstance().getSpreadsheetApp().getUi();

  ui.createMenu('Audience Manager')
    .addItem('Launch', 'launchAudienceManager')
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
 * @returns {{networkId: string, advertiserId: string}} A JS object containing
 *     the CM360 Network and Advertiser ID
 */
function getClientAccountConfiguration() {
  const networkId = SheetsService.getInstance().getCellValue(
    CONFIG.accountData.sheetName,
    CONFIG.accountData.networkId.row,
    CONFIG.accountData.networkId.col
  );
  const advertiserId = SheetsService.getInstance().getCellValue(
    CONFIG.accountData.sheetName,
    CONFIG.accountData.advertiserId.row,
    CONFIG.accountData.advertiserId.col
  );

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

/**
 * Retrieves configured audience lists from the logged in user's account.
 * @see jobs.js#loadAudiencesJob
 *
 * @param {!Job} job The job instance passed by the jobs infrastructure
 * @returns {!Job} The modified job instance
 */
function loadAudiences(job: Job) {
  return getAudiencesController().loadAudiences(job);
}

/**
 * Creates a single audience. Triggered once for every added audience from
 * {@link #loadudiences}.
 * @see jobs.js#loadAudienceJob
 *
 * @param {!AudienceLoadJob} job The job instance passed by the jobs
 *     infrastructure
 * @returns {!AudienceLoadJob} The job instance
 */
function loadAudience(job: AudienceLoadJob) {
  return getAudiencesController().loadAudience(job);
}

/**
 * Clears all logs from the log sheet.
 *
 * @param {!Job} job The job object that is provided by the infrastructure. In
 *     this case it doesn't include any additional relevant information
 * @returns {!Job} The input job object
 */
function clearLogs(job: Job) {
  return getLogger().clearLogs(job);
}

/**
 * Extracts logs from the given jobs then and writes them to the log sheet.
 *
 * @param {!Job} job The job wrapper which contains jobs with log messages to
 *     write and the offset to write them at
 * @returns {!Job} The modified input job wrapper
 */
function writeLogs(job: Job) {
  return getLogger().writeLogs(job);
}

/**
 * Identifies and updates audiences added to the underlying spreadsheet.
 * @see jobs.js#processAudiencesJob
 *
 * @param {!Job} job The job instance passed by the jobs infrastructure
 * @returns {!Job} The modified job instance
 */
function processAudiences(job: Job) {
  return getAudienceProcessJobController().processAudiences(job);
}

/**
 * Creates a single audience. Triggered once for every added audience from
 * {@link #processAudiences}.
 * @see jobs.js#processAudienceJob
 *
 * @param {!AudienceProcessJob} job The job instance passed by the jobs
 *     infrastructure
 * @returns {!AudienceProcessJob} The job instance
 */
function processAudience(job: AudienceProcessJob) {
  return getAudienceProcessJobController().processAudience(job);
}

/**
 * Returns the SheetsService instance, initializing it if it does not exist yet.
 *
 * @returns {!SheetsService} The initialized SheetsService instance
 */
/* function getSheetsService() {
  if (typeof sheetsService === 'undefined') {
    sheetsService = new SheetsService();
  }
  return sheetsService;
}*/

/**
 * Returns the CampaignManagerFacade instance, initializing it if it does not
 * exist yet.
 *
 * @returns {!CampaignManagerFacade} The initialized CampaignManagerFacade
 *     instance
 */
function getCampaignManagerService() {
  if (typeof campaignManagerService === 'undefined') {
    campaignManagerService = new CampaignManagerFacade(
      getClientAccountConfiguration(),
      CONFIG.apiFirst,
      CONFIG.advertisersFilter
    );
  }
  return campaignManagerService;
}

/**
 * Returns the Logger instance, initializing it if it does not exist yet.
 *
 * @returns {!CustomLogger} The initialized Logger instance
 */
function getLogger() {
  if (typeof logger === 'undefined') {
    logger = new CustomLogger(SheetsService.getInstance());
  }
  return logger;
}

/**
 * Returns the AudiencesController instance, initializing it if it does not
 * exist yet.
 *
 * @returns {!AudiencesController} The initialized AudiencesController
 *     instance
 */
function getAudiencesController() {
  if (typeof audiencesController === 'undefined') {
    audiencesController = new AudiencesController(
      SheetsService.getInstance(),
      getCampaignManagerService()
    );
  }
  return audiencesController;
}

/**
 * Returns the AudienceProcessJobController instance, initializing it if it does
 * not exist yet.
 *
 * @returns {!AudienceProcessJobController} The initialized
 *     AudienceProcessJobController instance
 */
function getAudienceProcessJobController() {
  if (typeof audienceProcessJobController === 'undefined') {
    audienceProcessJobController = new AudienceProcessJobController(
      SheetsService.getInstance(),
      getCampaignManagerService()
    );
  }
  return audienceProcessJobController;
}
