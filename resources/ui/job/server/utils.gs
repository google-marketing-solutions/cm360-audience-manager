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
 * @class JobUtil representing a utility class for properly deserializing Job
 * types.
 */
class JobUtil {

  /**
   * Converts a parsed JSON representation of a Job or a child type into a
   * proper instance of Job or the child type.
   * @see Runner#handler_
   * @see jobs.js#invoke_
   *
   * @param {!Object} parsedObj The result of JSON.parse on the serialized JSON
   *     string representation of Job or a child type
   * @return {!Job} An instance of Job or the child type
   */
  static fromJson(parsedObj) {
    const jobType = parsedObj.jobType_ || JobType.GENERIC;
    let job = null;

    switch(jobType) {
      case JobType.AUDIENCE_UPDATE:
        job = this.audienceUpdateJobFromJson_(parsedObj);
        break;
      default:
        job = this.jobFromJson_(parsedObj);
    }
    return job;
  }

  /**
   * Converts a parsed JSON representation of a Job into a proper instance of
   * Job, handling proper deserialization of inner jobs.
   *
   * @param {!Object} parsedObj The result of JSON.parse on the serialized JSON
   *     string representation of Job
   * @return {!Job} An instance of Job
   * @private
   */
  static jobFromJson_(parsedObj) {
    const id = parsedObj.id_ || 0;
    const status = parsedObj.status_ || JobStatus.PENDING;
    const offset = parsedObj.offset_ || 0;
    const error = parsedObj.error_ || '';
    const jobType = parsedObj.jobType_ || JobType.GENERIC;

    let logs = [];
    if (parsedObj.logs_) {
      logs = parsedObj.logs_.map((log) => {
        if (log.date && log.message) {
          return {
            date: new Date(log.date),
            message: log.message,
          };
        }
        return log;
      });
    }

    let jobs = [];
    if (parsedObj.jobs_) {
      jobs = parsedObj.jobs_.map((job) => this.fromJson(job));
    }

    const job =
        new Job(id, /* run= */ true, logs, jobs, offset, error, jobType);

    switch(status) {
      case JobStatus.RUNNING:
        job.run();
        break;
      case JobStatus.COMPLETE:
        job.complete();
        break;
      case JobStatus.ERROR:
        job.error(error);
        break;
    }
    return job;
  }

  /**
   * Converts a parsed JSON representation of an AudienceUpdateJob into a
   * proper instance of AudienceUpdateJob.
   *
   * @param {!Object} parsedObj The result of JSON.parse on the serialized JSON
   *     string representation of AudienceUpdateJob
   * @return {!AudienceUpdateJob} An instance of AudienceUpdateJob
   * @private
   */
  static audienceUpdateJobFromJson_(parsedObj) {
    const job = this.jobFromJson_(parsedObj);

    const extParams = {
      audienceId: parsedObj.audienceId_,
      audienceListResource: parsedObj.audienceListResource_,
      changedAttributes: parsedObj.changedAttributes_,
      idx: parsedObj.idx_,
      shareableWithAllAdvertisers: parsedObj.shareableWithAllAdvertisers_,
    };

    const audienceUpdateJob = new AudienceUpdateJob(extParams, {
      id: job.getId(),
      run: true,
      logs: job.getLogs(),
      jobs: job.getJobs(),
      offset: job.getOffset(),
      error: job.getError(),
      jobType: job.getJobType(),
    });
    return audienceUpdateJob;
  }
}

