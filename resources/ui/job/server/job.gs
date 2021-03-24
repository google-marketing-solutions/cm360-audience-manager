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
 * @fileoverview This file contains the definition of the job object that is
 * used by the jobs infrastructure for parallel processing.
 */


/**
 * Internal job status enum, not exposed in {@link globals.js} along with the
 * rest of the config values since these should not be changed.
 * @enum {string}
 */
const JobStatus = {
  COMPLETE: 'COMPLETE',
  ERROR: 'ERROR',
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
};

/**
 * Internal job type enum for proper deserialization in {@link #invoke_}.
 * Not exposed in {@link globals.js} along with the rest of the config values
 * since these should not be changed.
 * @enum {string}
 */
const JobType = {
  AUDIENCE_CREATE: 'AUDIENCE_CREATE',
  AUDIENCE_UPDATE: 'AUDIENCE_UPDATE',
  GENERIC: 'GENERIC',
};

/**
 * @class Job representing the definition of a job.
 */
class Job {
  /**
   * @constructs an instance of Job.
   *
   * @param {number=} id Optional job identifier. Falls back to 0
   * @param {number=} index Optional job index. Falls back to 0
   * @param {boolean=} run Optional flag whether to run the job or not. If the
   *     flag isn't present or true the job will run
   * @param {!Array<{date: !Date, message: string}>=} logs Optional array of
   *     logs (date and message pairs) associated with this job
   * @param {!Array<!Job>=} jobs Optional array of sub-Jobs belonging to this
   *     job. Relevant when the 'Job' itself is used as a wrapper to collect the
   *     actual jobs to run
   * @param {number=} offset Optional offset to pass along to job handlers. Used
   *     when writing logs for example to skip already written entries
   * @param {string=} error Optional error message to pass if an error occurred
   * @param {!JobType=} jobType The type of Job to deserialize
   */
  constructor(
      id = 0,
      index = 0,
      run = true,
      logs = [],
      jobs = [],
      offset = 0,
      error = '',
      jobType = JobType.GENERIC) {
    /** @private {number} */
    this.id_ = id;

    /** @private @const {number} */
    this.index_ = index;

    /** @private {!JobStatus} */
    this.status_ = run ? JobStatus.PENDING : JobStatus.COMPLETE;

    /** @private {!Array<{date: !Date, message: string}>} */
    this.logs_ = logs;

    /** @private {!Array<!Job>} */
    this.jobs_ = jobs;

    /** @private {number} */
    this.offset_ = offset;

    /** @private {string} */
    this.error_ = error;

    /** @private {!JobType} */
    this.jobType_ = jobType;
  }

  /**
   * Sets the status to RUNNING.
   */
  run() {
    this.updateStatus_(JobStatus.RUNNING);
  }

  /**
   * Sets the status to COMPLETE.
   */
  complete() {
    this.updateStatus_(JobStatus.COMPLETE);
  }

  /**
   * Sets the status to ERROR and sets the error object.
   *
   * @param {string} error The error to set
   */
  error(error) {
    this.updateStatus_(JobStatus.ERROR);
    this.setError_(error);
  }

  /**
   * Checks whether the status is PENDING.
   *
   * @return {boolean} Whether the status is PENDING
   */
  isPending() {
    return this.isStatus_(JobStatus.PENDING);
  }

  /**
   * Checks whether the status is RUNNING.
   *
   * @return {boolean} Whether the status is RUNNING
   */
  isRunning() {
    return this.isStatus_(JobStatus.RUNNING);
  }

  /**
   * Checks whether the status is COMPLETE.
   *
   * @return {boolean} Whether the status is COMPLETE
   */
  isComplete() {
    return this.isStatus_(JobStatus.COMPLETE);
  }

  /**
   * Checks whether the status is ERROR.
   *
   * @return {boolean} Whether the status is ERROR
   */
  isError() {
    return this.isStatus_(JobStatus.ERROR);
  }

  /**
   * Appends log messages to the job's logs.
   *
   * @param {!Array<string>} logs The log messages to append
   */
  log(logs) {
    const date = new Date();
    logs.forEach((log) => {
      this.logs_.push({date: date, message: log});
    });
  }

  /**
   * Clears the logs associated with this job.
   */
  clearLogs() {
    this.logs_ = [];
  }

  /**
   * Returns the job's logs.
   *
   * @return {!Array<{date: !Date, message: string}>} The job's logs array
   */
  getLogs() {
    return this.logs_;
  }

  /**
   * Returns the job's inner jobs. This array is mutable and therefore
   * {@link Array.prototype.push} can be used to add elements to it.
   * @example <caption>Example usage for adding a single element.</caption>
   * // returns [innerJob]
   * const innerJob = new Job();
   * const job = new Job();
   * job.getJobs().push(innerJob);
   * @example <caption>Example usage for adding multiple elements.</caption>
   * // returns [innerJob, innerJob]
   * const innerJob = new Job();
   * const jobs = [innerJob, innerJob];
   * const job = new Job();
   * job.getJobs().push(...jobs);
   *
   * @return {!Array<!Job>} The job's jobs array
   */
  getJobs() {
    return this.jobs_;
  }

  /**
   * Returns the job's id.
   *
   * @return {number} The job's id
   */
  getId() {
    return this.id_;
  }

  /**
   * Sets the job's id.
   *
   * @param {number} id The id to set
   */
  setId(id) {
    this.id_ = id;
  }

  /**
   * Returns the job's index.
   *
   * @return {number} The job's index
   */
  getIndex() {
    return this.index_;
  }

  /**
   * Returns the job's offset.
   *
   * @return {number} The job's offset
   */
  getOffset() {
    return this.offset_;
  }

  /**
   * Sets the job's offset.
   *
   * @param {number} offset The offset to set
   */
  setOffset(offset) {
    this.offset_ = offset;
  }

  /**
   * Returns the job's error.
   *
   * @return {string} The job's error
   */
  getError() {
    return this.error_;
  }

  /**
   * Sets the job's error.
   *
   * @param {string} error The error to set
   * @private
   */
  setError_(error) {
    this.error_ = error;
  }

  /**
   * Sets the status.
   *
   * @param {!JobStatus} status The status to set
   * @private
   */
  updateStatus_(status) {
    this.status_ = status;
  }

  /**
   * Checks whether the status matches the given value.
   *
   * @param {!JobStatus} status The status to check
   * @return {boolean} Whether the status matches
   * @private
   */
  isStatus_(status) {
     return this.status_ === status;
  }

  /**
   * Returns the job's type.
   *
   * @return {!JobType} The job's type
   */
  getJobType() {
    return this.jobType_;
  }
}

