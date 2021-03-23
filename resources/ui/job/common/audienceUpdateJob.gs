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
   *     shareableWithAllAdvertisers: boolean,
   * }} extParams
   * @param {{
   *     id: number,
   *     run: boolean,
   *     logs: !Array<{date: !Date, message: string}>,
   *     jobs: !Array<!AudienceUpdateJob>,
   *     offset: number,
   *     error: string,
   *     jobType: !JobType,
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
        run = true,
        logs = [],
        jobs = [],
        offset = 0,
        error = '',
        jobType = JobType.AUDIENCE_UPDATE,
      } = {}) {
    super(id, run, logs, jobs, offset, error, jobType);

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
   * Returns the shareableWithAllAdvertisers boolean.
   *
   * @return {boolean} The shareableWithAllAdvertisers boolean
   */
  isShareableWithAllAdvertisers() {
    return this.shareableWithAllAdvertisers_;
  }

}

