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
 * @fileoverview Utility file to enable running jobs in Google Sheets by opening
 * a sidebar on the user's browser. This circumvents Apps Script's execution
 * time limits and allows for parallel processing.
 */


/**
 * Includes an HTML file within another HTML file.
 * @see jobs.html
 *
 * @param {string} filename The name of the file to include
 * @return {string} The HTML content
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Opens a sidebar on Google Sheets and fills it using the content of
 * {@link jobs.html}.
 * @see main.js#onOpen
 */
function showAudiencesSidebar() {
  const sheetsService = new SheetsService();
  const html = HtmlService
      .createTemplateFromFile('ui/job/client/jobs')
      .evaluate();
  sheetsService.showSidebar(html);
}

/**
 * Defines the 'createAudiences' job.
 * @see jobs.html#createAudiencesHandler
 * @see main.js#createAudiences
 * @see JobName.CREATE_AUDIENCES
 *
 * @param {string} json A JSON representation of an object that contains an
 *     empty array that will be filled by the invoked method with single or
 *     multiple audience definitions depending on the actual list of audiences
 *     to create
 * @return {string} A JSON string of the result of 'createAudiences'
 */
function createAudiencesJob(json) {
  return invoke_('createAudiences', json);
}

/**
 * Defines the 'createAudience' job.
 * @see jobs.html#createAudiencesHandler
 * @see main.js#createAudience
 * @see JobName.CREATE_AUDIENCE
 *
 * @param {string} json A JSON representation of an audience definition to
 *     create
 * @return {string} A JSON string of the result of 'createAudience'
 */
function createAudienceJob(json) {
  return invoke_('createAudience', json);
}

/**
 * Defines the 'updateAudiences' job.
 * @see jobs.html#updateAudiencesHandler
 * @see main.js#updateAudiences
 * @see JobName.UPDATE_AUDIENCES
 *
 * @param {string} json A JSON representation of an object that contains an
 *     empty array that will be filled by the invoked method with single or
 *     multiple audience definitions depending on the actual list of audiences
 *     to update
 * @return {string} A JSON string of the result of 'updateAudiences'
 */
function updateAudiencesJob(json) {
  return invoke_('updateAudiences', json);
}

/**
 * Defines the 'updateAudience' job
 * @see jobs.html#updateAudiencesHandler
 * @see main.js#updateAudience
 * @see JobName.UPDATE_AUDIENCE
 *
 * @param {string} json A JSON representation of an audience definition to
 *     update
 * @return {string} A JSON string of the result of 'updateAudience'
 */
function updateAudienceJob(json) {
  return invoke_('updateAudience', json);
}

/**
 * Defines the 'updateAllAudiences' job.
 * @see jobs.html#updateAllAudiencesHandler
 * @see main.js#updateAllAudiences
 * @see JobName.UPDATE_ALL_AUDIENCES
 *
 * @param {string} json A JSON representation of an object that contains an
 *     empty array that will be filled by the invoked method with all available
 *     audiences to update them all
 * @return {string} A JSON string of the result of 'updateAllAudiences'
 */
function updateAllAudiencesJob(json) {
  return invoke_('updateAllAudiences', json);
}

/**
 * Defines the 'clearLogs' job.
 * @see client/logger.js#clear
 * @see main.js#clearLogs
 * @see JobName.CLEAR_LOGS
 *
 * @param {string} json A JSON representation of an object that contains the
 *     range to clear
 * @return {string} A JSON string of the result of 'clearLogs_'
 */
function clearLogsJob(json) {
  return invoke_('clearLogs', json);
}

/**
 * Defines the 'writeLogs' job.
 * @see client/logger.js#log
 * @see main.js#writeLogs
 * @see JobName.WRITE_LOGS
 *
 * @param {string} json A JSON representation of an object that contains the log
 *     messages to write and an offset corresponding to the sheet rows to skip
 *     before writing the logs
 * @return {string} A JSON string of the result of 'writeLogs_'
 */
function writeLogsJob(json) {
  return invoke_('writeLogs', json);
}

/**
 * Invokes the function given by 'functionName', parsing and passing 'input' as
 * a parameter to it.
 *
 * @param {string} functionName The name of the function to invoke
 * @param {string} input The JSON string input to parse and pass along to the
 *     function to invoke
 * @return {string} A JSON string of the result of the invoked function
 * @throws {Error!} Representing the job that failed and the error that happened
 * @private
 */
function invoke_(functionName, input) {
  let job = {};

  try {
    const parsedInput = JSON.parse(input);
    job = JobUtil.fromJson(parsedInput);

    return JSON.stringify(GLOBALCTX[functionName](job));
  } catch(error) {
    job.error(error.message);

    throw new Error(JSON.stringify(job));
  }
}
