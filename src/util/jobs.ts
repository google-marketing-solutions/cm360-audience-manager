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

/**
 * @fileoverview Utility file to enable running jobs in Google Sheets by opening
 * a sidebar on the user's browser. This circumvents Apps Script's execution
 * time limits and allows for parallel processing.
 */

import { GLOBALCTX } from '../config';
import { SheetsService } from '../service/sheets';
import { type Job } from '../model/job';
import { JobUtil } from '../util/job';

/**
 * This is required to avoid treeshaking this file.
 * As long as anything from a file is being used, the entire file
 * is being kept.
 * The workaround is necessary to achieve a modular codebase
 * because rollup does not realize functions
 * being called via 'GLOBALCTX![functionName]' or 'google.script.run'.
 */
export const keepJobs = null;

/**
 * Includes an HTML file within another HTML file.
 * @see jobs.html
 *
 * @param {string} filename The name of the file to include
 * @returns {string} The HTML content
 */
export function include(filename: string): string {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Opens a sidebar on Google Sheets and fills it using the content of
 * {@link manager.html}.
 * @see main.js#onOpen
 */
export function launchAudienceManager() {
  const sheetsService = SheetsService.getInstance();
  const html = HtmlService.createTemplateFromFile('static/index').evaluate();
  sheetsService.showSidebar(html);
}

/**
 * Defines the 'loadAudiences' job.
 * @see jobs.html#loadAudiencesHandler
 * @see main.js#loadAudiences
 * @see JobName.LOAD_AUDIENCES
 *
 * @param {string} json A JSON representation of an object that contains an
 *     empty array that will be filled by the invoked method with single or
 *     multiple audience definitions depending on the actual list of audiences
 *     to process
 * @returns {string} A JSON string of the result of 'loadAudiences'
 */
export function loadAudiencesJob(json: string): string {
  return invoke_('loadAudiences', json);
}

/**
 * Defines the 'loadAudience' job.
 * @see jobs.html#loadAudiencesHandler
 * @see main.js#loadAudience
 * @see JobName.LOAD_AUDIENCE
 *
 * @param {string} json A JSON representation of an audience definition to
 *     load
 * @returns {string} A JSON string of the result of 'loadAudience'
 */
export function loadAudienceJob(json: string): string {
  return invoke_('loadAudience', json);
}

/**
 * Defines the 'processAudiences' job.
 * @see jobs.html#processAudiencesHandler
 * @see main.js#processAudiences
 * @see JobName.PROCESS_AUDIENCES
 *
 * @param {string} json A JSON representation of an object that contains an
 *     empty array that will be filled by the invoked method with single or
 *     multiple audience definitions depending on the actual list of audiences
 *     to process
 * @returns {string} A JSON string of the result of 'processAudiences'
 */
export function processAudiencesJob(json: string): string {
  return invoke_('processAudiences', json);
}

/**
 * Defines the 'processAudience' job.
 * @see jobs.html#processAudiencesHandler
 * @see main.js#processAudience
 * @see JobName.PROCESS_AUDIENCE
 *
 * @param {string} json A JSON representation of an audience definition to
 *     process
 * @returns {string} A JSON string of the result of 'processAudience'
 */
export function processAudienceJob(json: string): string {
  return invoke_('processAudience', json);
}

/**
 * Defines the 'clearLogs' job.
 * @see client/logger.js#clear
 * @see main.js#clearLogs
 * @see JobName.CLEAR_LOGS
 *
 * @param {string} json A JSON representation of an object that contains the
 *     range to clear
 * @returns {string} A JSON string of the result of 'clearLogs_'
 */
export function clearLogsJob(json: string): string {
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
 * @returns {string} A JSON string of the result of 'writeLogs_'
 */
export function writeLogsJob(json: string): string {
  return invoke_('writeLogs', json);
}

/**
 * Invokes the function given by 'functionName', parsing and passing 'input' as
 * a parameter to it.
 *
 * @param {string} functionName The name of the function to invoke
 * @param {string} input The JSON string input to parse and pass along to the
 *     function to invoke
 * @returns {string} A JSON string of the result of the invoked function
 * @throws {Error!} Representing the job that failed and the error that happened
 * @private
 */
function invoke_(functionName: string, input: string): string {
  let job: Job | undefined = undefined;

  try {
    const parsedInput = JSON.parse(input);
    job = JobUtil.fromJson(parsedInput);

    const res = JSON.stringify((GLOBALCTX![functionName] as Function)(job));

    return res;
  } catch (err: unknown) {
    const error = err as Error;

    if (typeof job !== 'undefined') {
      job.error(error.message);
    }

    throw new Error(JSON.stringify(job));
  }
}
