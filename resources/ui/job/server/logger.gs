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
 * @fileoverview This file encapsulates all logic for logging messages from the
 * jobs infrastructure to the associated Google Sheets spreadsheet.
 */


/**
 * @class Logger representing a class for holding all logic for logging messages
 * from the underlying jobs infrastructure.
 */
class Logger {
  /**
   * @constructs an instance of Logger, which is responsible for writing any job
   * logs to the underlying spreadsheet in a dedicated sheet.
   *
   * @param {!SheetsService} sheetsService The injected SheetsService dependency
   */
  constructor(sheetsService) {
    /** @private @const {!SheetsService} */
    this.sheetsService_ = sheetsService;
  }

  /**
   * Clears all logs from the log sheet by delegating to
   * {@link SheetsService#clearRange}.
   *
   * @param {!Job} job The job object that is provided by the infrastructure. In
   *     this case it doesn't include any additional relevant information
   * @param {{
   *     sheetName: string,
   *     range: string,
   * }=} params
   * @return {!Job} The input job object
   */
  clearLogs(job, {
      sheetName = CONFIG.logging.sheetName,
      range = CONFIG.logging.range} = {}) {
    this.getSheetsService().clearRange(sheetName, range);
    return job;
  }

  /**
   * Extracts logs from the given jobs then calls
   * {@link SheetsService#setValuesInRange} to write job logs to the log sheet.
   *
   * @param {!Job} job The job wrapper which contains jobs with log messages to
   *     write and the offset to write them at
   * @param {{
   *     sheetName: string,
   *     row: number,
   *     col: number,
   * }=} params
   * @return {!Job} The modified input job wrapper
   */
  writeLogs(job, {
      sheetName = CONFIG.logging.sheetName,
      row = CONFIG.logging.row,
      col = CONFIG.logging.col} = {}) {
    const output = [];
    output.push(...this.mapAndClearLogs_(job));

    job.getJobs()
        .forEach((innerJob) => {
          output.push(...this.mapAndClearLogs_(innerJob));
        });

    if (output.length !== 0) {
      const offsetRow = job.getOffset() + row;
      job.setOffset(job.getOffset() + output.length);
      this.getSheetsService()
          .setValuesInDefinedRange(sheetName, offsetRow, col, output);
    }
    return job;
  }

  /**
   * Maps a job's logs from an object to an array, pushes that array into a 2D
   * output array, and clears the job's logs.
   *
   * @param {!Job} job The Job instance
   * @return {!Array<!Array<(!Date|string)>>} output The 2D output array
   * @private
   */
  mapAndClearLogs_(job) {
    const output = [];

    if (job.getLogs().length !== 0) {
      const mapper = (/** {date: !Date, message: string} */ log) =>
        [log.date, log.message];
      output.push(...job.getLogs().map(mapper));
      job.clearLogs();
    }
    return output;
  }

  /**
   * Returns the SheetsService instance.
   *
   * @return {!SheetsService} The SheetsService instance
   */
  getSheetsService() {
    return this.sheetsService_;
  }

}

