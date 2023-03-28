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
 * @fileoverview This file contains the definition of the job object that is
 * used by the jobs infrastructure for parallel processing, along with child
 * objects for audience 'create' and 'update' jobs respectively.
 */

/**
 * Defines the job status enum. These consts are used by the underlying jobs
 * infrastructure to trigger pending jobs, count running jobs, and signal
 * completion for success and error cases respectively.
 * @enum {string}
 */
export enum JobStatus {
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
}

/**
 * Defines the job type enum. These consts are used for proper deserialization
 * of Job and its child types in {@link JobUtil#fromJson}.
 * @enum {string}
 */
export enum JobType {
  AUDIENCE_LOAD = 'AUDIENCE_LOAD',
  AUDIENCE_PROCESS = 'AUDIENCE_PROCESS',
  GENERIC = 'GENERIC',
}

/**
 * Defines the job name enum. These consts are used to refer to the different
 * 'method' names that will be triggered asynchronously by the underlying jobs
 * infrastructure.
 * @see static/logger.js
 * @see static/jobs.html
 * @see static/jobs.js
 * @enum {string}
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const JobName = {
  CLEAR_LOGS: 'clearLogsJob',
  LOAD_AUDIENCES: 'loadAudiencesJob',
  LOAD_AUDIENCE: 'loadAudienceJob',
  PROCESS_AUDIENCES: 'processAudiencesJob',
  PROCESS_AUDIENCE: 'processAudienceJob',
  WRITE_LOGS: 'writeLogsJob',
};

export interface JobLog {
  date: Date | string;
  message: string;
}

export interface JobParams {
  id?: number;
  index?: number;
  run?: boolean;
  logs?: JobLog[];
  jobs?: Job[];
  offset?: number;
  error?: string;
}

/**
 * Job representing the definition of a job.
 */
export class Job {
  private id_: number;
  private readonly index_: number;
  private status_: JobStatus;
  private logs_: JobLog[];
  private readonly jobs_: Job[];
  private offset_: number;
  private error_: string;
  protected readonly type: JobType = JobType.GENERIC;
  /**
   * @param {number=} id Optional job identifier. Falls back to 0
   * @param {number=} index Optional job index. Falls back to 0
   * @param {boolean=} run Optional flag whether to run the job or not. If the
   *     flag isn't present or true the job will run
   * @param {JobLog[]=} logs Optional array of
   *     logs (date and message pairs) associated with this job
   * @param {Job[]=} jobs Optional array of sub-Jobs belonging to this
   *     job. Relevant when the 'Job' itself is used as a wrapper to collect the
   *     actual jobs to run
   * @param {number=} offset Optional offset to pass along to job handlers. Used
   *     when writing logs for example to skip already written entries
   * @param {string=} error Optional error message to pass if an error occurred
   */
  constructor(
    id = 0,
    index = 0,
    run = true,
    logs: JobLog[] = [],
    jobs: Job[] = [],
    offset = 0,
    error = ''
  ) {
    this.id_ = id;
    this.index_ = index;
    this.status_ = run ? JobStatus.PENDING : JobStatus.COMPLETE;
    this.logs_ = logs;
    this.jobs_ = jobs;
    this.offset_ = offset;
    this.error_ = error;
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
  error(error: string) {
    this.updateStatus_(JobStatus.ERROR);
    this.setError_(error);
  }

  /**
   * Checks whether the status is PENDING.
   *
   * @returns {boolean} Whether the status is PENDING
   */
  isPending() {
    return this.isStatus_(JobStatus.PENDING);
  }

  /**
   * Checks whether the status is RUNNING.
   *
   * @returns {boolean} Whether the status is RUNNING
   */
  isRunning() {
    return this.isStatus_(JobStatus.RUNNING);
  }

  /**
   * Checks whether the status is COMPLETE.
   *
   * @returns {boolean} Whether the status is COMPLETE
   */
  isComplete() {
    return this.isStatus_(JobStatus.COMPLETE);
  }

  /**
   * Checks whether the status is ERROR.
   *
   * @returns {boolean} Whether the status is ERROR
   */
  isError() {
    return this.isStatus_(JobStatus.ERROR);
  }

  /**
   * Appends log messages to the job's logs.
   *
   * @param {string[]} logs The log messages to append
   */
  log(logs: string[]) {
    const date = new Date();
    logs.forEach(log => {
      this.logs_.push({ date, message: log });
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
   * @returns {JobLog[]} The job's logs array
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
   * @returns {!Array<!Job>} The job's jobs array
   */
  getJobs() {
    return this.jobs_;
  }

  /**
   * Returns the job's id.
   *
   * @returns {number} The job's id
   */
  getId() {
    return this.id_;
  }

  /**
   * Sets the job's id.
   *
   * @param {number} id The id to set
   */
  setId(id: number) {
    this.id_ = id;
  }

  /**
   * Returns the job's index.
   *
   * @returns {number} The job's index
   */
  getIndex() {
    return this.index_;
  }

  /**
   * Returns the job's offset.
   *
   * @returns {number} The job's offset
   */
  getOffset() {
    return this.offset_;
  }

  /**
   * Sets the job's offset.
   *
   * @param {number} offset The offset to set
   */
  setOffset(offset: number) {
    this.offset_ = offset;
  }

  /**
   * Returns the job's error.
   *
   * @returns {string} The job's error
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
  setError_(error: string) {
    this.error_ = error;
  }

  /**
   * Sets the status.
   *
   * @param {!JobStatus} status The status to set
   * @private
   */
  updateStatus_(status: JobStatus) {
    this.status_ = status;
  }

  /**
   * Checks whether the status matches the given value.
   *
   * @param {!JobStatus} status The status to check
   * @returns {boolean} Whether the status matches
   * @private
   */
  isStatus_(status: JobStatus) {
    return this.status_ === status;
  }

  /**
   * Returns the job's type.
   *
   * @returns {!JobType} The job's type
   */
  getJobType() {
    return this.type;
  }

  /**
   * Updates the job's status as it is reset on creation based on the value of
   * the 'run' boolean flag.
   *
   * @param {JobStatus} status The status to set
   * @param {string} error The error to set in case of an ERROR status
   */
  updateStatus(status: JobStatus, error: string) {
    switch (status) {
      case JobStatus.RUNNING:
        this.run();
        break;
      case JobStatus.COMPLETE:
        this.complete();
        break;
      case JobStatus.ERROR:
        this.error(error);
        break;
    }
  }
}
