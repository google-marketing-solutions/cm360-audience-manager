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
 * used by the jobs infrastructure for parallel processing, along with child
 * objects for audience 'create' and 'update' jobs respectively.
 */


/**
 * Defines the job status enum. These consts are used by the underlying jobs
 * infrastructure to trigger pending jobs, count running jobs, and signal
 * completion for success and error cases respectively.
 * @enum {string}
 */
const JobStatus = {
  COMPLETE: 'COMPLETE',
  ERROR: 'ERROR',
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
};

/**
 * Defines the job type enum. These consts are used for proper deserialization
 * of Job and its child types in {@link JobUtil#fromJson}.
 * @enum {string}
 */
const JobType = {
  AUDIENCE_CREATE: 'AUDIENCE_CREATE',
  AUDIENCE_UPDATE: 'AUDIENCE_UPDATE',
  GENERIC: 'GENERIC',
};

/**
 * Defines the job name enum. These consts are used to refer to the different
 * 'method' names that will be triggered asynchronously by the underlying jobs
 * infrastructure.
 * @see client/logger.js
 * @see client/jobs.html
 * @see server/jobs.js
 * @enum {string}
 */
const JobName = {
  CLEAR_LOGS: 'clearLogsJob',
  CREATE_AUDIENCES: 'createAudiencesJob',
  CREATE_AUDIENCE: 'createAudienceJob',
  UPDATE_ALL_AUDIENCES: 'updateAllAudiencesJob',
  UPDATE_AUDIENCES: 'updateAudiencesJob',
  UPDATE_AUDIENCE: 'updateAudienceJob',
  WRITE_LOGS: 'writeLogsJob',
};

/**
 * Defines the audience rules relationship type enum, which represents the
 * desired logical relationship between the rules in the audience rules array.
 * @see AudienceUpdateJob
 * @enum {string}
 */
const AudienceRuleRelationshipType = {
  AND: 'AND',
  OR: 'OR',
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

/**
 * @class AudienceCreateJob representing the definition of a more specific Job
 * type that is used for audience creation jobs.
 */
class AudienceCreateJob extends Job {
  /**
   * Defines an AudienceRule type.
   * @typedef {{
   *   name: string,
   *   operator: string,
   *   value: string,
   *   negation: boolean,
   * }} AudienceRule
   */

  /**
   * @constructs an instance of AudienceCreateJob.
   *
   * @param {{
   *   audienceName: string,
   *   description: string,
   *   lifeSpan: string,
   *   idx: number,
   *   floodlightId: (number|undefined),
   * }} extParams
   * @param {{
   *   id: number,
   *   index: number,
   *   run: boolean,
   *   logs: !Array<{date: !Date, message: string}>,
   *   jobs: !Array<!AudienceCreateJob>,
   *   offset: number,
   *   error: string,
   *   jobType: !JobType,
   * }=} baseParams
   */
  constructor(
      {
        audienceName,
        description,
        lifeSpan,
        idx,
        floodlightId,
      },
      {
        id = 0,
        index = idx,
        run = true,
        logs = [],
        jobs = [],
        offset = 0,
        error = '',
        jobType = JobType.AUDIENCE_CREATE,
      } = {}) {
    super(id, index, run, logs, jobs, offset, error, jobType);

    /** @private @const {string} */
    this.audienceName_ = audienceName;

    /** @private @const {string} */
    this.description_ = description;

    /** @private @const {string} */
    this.lifeSpan_ = lifeSpan;

    /** @private @const {number|undefined} */
    this.floodlightId_ = floodlightId;

    /**
     * @private {{
     *   relationship: !AudienceRuleRelationshipType,
     *   rules: !Array<!AudienceRule>,
     * }}
     */
    this.audienceRules_ = {
      relationship: AudienceRuleRelationshipType.AND,
      rules: [],
    };
  }

  /**
   * Returns the audienceName.
   *
   * @return {string} The audienceName
   */
  getAudienceName() {
    return this.audienceName_;
  }

  /**
   * Returns the description.
   *
   * @return {string} The description
   */
  getDescription() {
    return this.description_;
  }

  /**
   * Returns the lifeSpan.
   *
   * @return {string} The lifeSpan
   */
  getLifeSpan() {
    return this.lifeSpan_;
  }

  /**
   * Returns the floodlightId.
   *
   * @return {number|undefined} The floodlightId
   */
  getFloodlightId() {
    return this.floodlightId_;
  }

  /**
   * Returns the audience rules.
   *
   * @return {{
   *   relationship: !AudienceRuleRelationshipType,
   *   rules: !Array<!AudienceRule>,
   * }} The audience rules
   */
  getAudienceRules() {
    return this.audienceRules_;
  }

  /**
   * Adds audience rules to the audience rules array, setting the relationship
   * type (or resetting it if previously set).
   *
   * @param {!Array<!AudienceRule>} audienceRules The audience rules to add
   * @param {!AudienceRuleRelationshipType=} audienceRuleRelationshipType The
   *     audience rule relationship type
   */
  addAudienceRules(audienceRules, audienceRuleRelationshipType = undefined) {
    if (audienceRuleRelationshipType) {
      this.getAudienceRules().relationship = audienceRuleRelationshipType;
    }
    this.getAudienceRules().rules.push(...audienceRules);
  }
}

/**
 * @class AudienceUpdateJob representing the definition of a more specific Job
 * type that is used for audience update jobs.
 */
class AudienceUpdateJob extends Job {
  /**
   * @constructs an instance of AudienceUpdateJob.
   *
   * @param {{
   *   audienceId: string,
   *   audienceListResource: !Object,
   *   changedAttributes: {
   *     id: string,
   *     name: (string|undefined),
   *     audienceListShares: (!Array<string>|undefined),
   *   },
   *   idx: number,
   *   shareableWithAllAdvertisers: boolean,
   * }} extParams
   * @param {{
   *   id: number,
   *   index: number,
   *   run: boolean,
   *   logs: !Array<{date: !Date, message: string}>,
   *   jobs: !Array<!AudienceUpdateJob>,
   *   offset: number,
   *   error: string,
   *   jobType: !JobType,
   * }=} baseParams
   */
  constructor(
      {
        audienceId,
        audienceListResource,
        changedAttributes,
        idx,
        shareableWithAllAdvertisers,
      },
      {
        id = 0,
        index = idx,
        run = true,
        logs = [],
        jobs = [],
        offset = 0,
        error = '',
        jobType = JobType.AUDIENCE_UPDATE,
      } = {}) {
    super(id, index, run, logs, jobs, offset, error, jobType);

    /** @private @const {string} */
    this.audienceId_ = audienceId;

    /** @private @const {!Object} */
    this.audienceListResource_ = audienceListResource;

    /**
     * @private @const {{
     *   id: string,
     *   name: (string|undefined),
     *   audienceListShares: (!Array<string>|undefined),
     * }}
     */
    this.changedAttributes_ = changedAttributes;

    /** @private @const {boolean} */
    this.shareableWithAllAdvertisers_ = shareableWithAllAdvertisers;
  }

  /**
   * Returns the audienceId.
   *
   * @return {string} The audienceId
   */
  getAudienceId() {
    return this.audienceId_;
  }

  /**
   * Returns the audienceListResource.
   *
   * @return {!Object} The audienceListResource
   */
  getAudienceListResource() {
    return this.audienceListResource_;
  }

  /**
   * Returns the changedAttributes.
   *
   * @return {{
   *   id: string,
   *   name: (string|undefined),
   *   audienceListShares: (!Array<string>|undefined),
   * }} The changedAttributes
   */
  getChangedAttributes() {
    return this.changedAttributes_;
  }

  /**
   * Returns the shareableWithAllAdvertisers boolean.
   *
   * @return {boolean} The shareableWithAllAdvertisers boolean
   */
  isShareableWithAllAdvertisers() {
    return this.shareableWithAllAdvertisers_;
  }
}

