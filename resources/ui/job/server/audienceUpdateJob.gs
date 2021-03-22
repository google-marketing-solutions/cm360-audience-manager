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
 * @fileoverview This file contains the definition of an audience update job
 * object that is used by the jobs infrastructure for parallel processing.
 */


/**
 * @class AudienceUpdateJob representing the definition of an AudienceUpdate
 * job.
 */
class AudienceUpdateJob extends Job {
  /**
   * @constructs an instance of AudienceUpdateJob.
   *
   * @param {{
   *     audienceId: string,
   *     audienceListResource: !Object,
   *     changedAttributes: {
   *         id: string,
   *         name: (string|undefined),
   *         audienceListShares: (!Array<string>|undefined),
   *     },
   *     idx: number,
   *     shareWithAllAdvertisers: boolean,
   * }} extParams
   * @param {{
   *     id: number,
   *     run: boolean,
   *     logs: !Array<{date: !Date, message: string}>,
   *     jobs: !Array<!AudienceUpdateJob>,
   *     offset: number,
   *     error: string,
   * }=} baseParams
   */
  constructor({
        audienceId,
        audienceListResource,
        changedAttributes,
        idx,
        shareWithAllAdvertisers,
      },
      {id = 0, run = true, logs = [], jobs = [], offset = 0, error = ''} = {}) {
    super(id, run, logs, jobs, offset, error);

    /** @private @const {string} */
    this.audienceId_ = audienceId;

    /** @private @const {!Object} */
    this.audienceListResource_ = audienceListResource;

    /**
     * @private @const {{
     *     id: string,
     *     name: (string|undefined),
     *     audienceListShares: (!Array<string>|undefined),
     * }}
     */
    this.changedAttributes_ = changedAttributes;

    /** @private @const {number} */
    this.idx_ = idx;

    /** @private @const {boolean} */
    this.shareWithAllAdvertisers_ = shareWithAllAdvertisers;
  }

  /**
   * Converts a parsed JSON representation of an AudienceUpdateJob into a proper
   * instance of AudienceUpdateJob.
   * @see Runner#successHandler
   * @see Runner#errorHandler
   *
   * @param {!Object} parsedObj The result of JSON.parse on the serialized JSON
   *     string representation of AudienceUpdateJob
   * @return {!AudienceUpdateJob} An instance of AudienceUpdateJob
   */
  static fromJson(parsedObj) {
    const job = Job.fromJson(parsedObj);

    const extParams = {
      audienceId: parsedObj.audienceId_,
      audienceListResource: parsedObj.audienceListResource_,
      changedAttributes: parsedObj.changedAttributes_,
      idx: parsedObj.idx_,
      shareWithAllAdvertisers: parsedObj.shareWithAllAdvertisers_,
    };

    const audienceUpdateJob = new AudienceUpdateJob(extParams, {
      id: job.getId(),
      run: true,
      logs: job.getLogs(),
      jobs: job.getJobs(),
      offset: job.getOffset(),
      error: job.getError(),
    });
    return audienceUpdateJob;
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
     *     id: string,
     *     name: (string|undefined),
     *     audienceListShares: (!Array<string>|undefined),
     * }} The changedAttributes
   */
  getChangedAttributes() {
    return this.changedAttributes_;
  }

  /**
   * Returns the idx.
   *
   * @return {number} The idx
   */
  getIdx() {
    return this.idx_;
  }

  /**
   * Returns the shareWithAllAdvertisers boolean.
   *
   * @return {boolean} The shareWithAllAdvertisers boolean
   */
  isShareWithAllAdvertisers() {
    return this.shareWithAllAdvertisers_;
  }

}

