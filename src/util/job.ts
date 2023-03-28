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

import { Audience } from '../model/audience';
import { AudienceLoadJob } from '../model/audienceLoadJob';
import { AudienceProcessJob } from '../model/audienceProcessJob';
import { Job, JobType, JobStatus, JobLog } from '../model/job';

/**
 * JobUtil representing a utility class for properly deserializing Job
 * types.
 */
export class JobUtil {
  /**
   * Converts a parsed JSON representation of a Job or a child type into a
   * proper instance of Job or the child type.
   * @see Runner#handler_
   * @see jobs.js#invoke_
   *
   * @param {!Record<string, unknown>} parsedObj The result of JSON.parse on the serialized JSON
   *     string representation of Job or a child type
   * @returns {!Job} An instance of Job or the child type
   */
  static fromJson(parsedObj: Record<string, unknown>): Job {
    const jobType = parsedObj.type || JobType.GENERIC;
    let job = null;

    switch (jobType) {
      case JobType.AUDIENCE_LOAD:
        job = JobUtil.audienceLoadJobFromJson_(parsedObj);
        break;
      case JobType.AUDIENCE_PROCESS:
        job = JobUtil.audienceProcessJobFromJson_(parsedObj);
        break;
      default:
        job = JobUtil.jobFromJson_(parsedObj);
    }
    return job;
  }

  /**
   * Converts a parsed JSON representation of a Job into a proper instance of
   * Job, handling proper deserialization of inner jobs.
   *
   * @param {!Record<string, any>} parsedObj The result of JSON.parse on the serialized JSON
   *     string representation of Job
   * @returns {!Job} An instance of Job
   * @private
   */
  static jobFromJson_(parsedObj: Record<string, any>) {
    const id = parsedObj.id_ ?? 0;
    const index = parsedObj.index_ ?? 0;
    const status = parsedObj.status_ ?? JobStatus.PENDING;
    const offset = parsedObj.offset_ ?? 0;
    const error = parsedObj.error_ ?? '';

    let logs = [];
    if (parsedObj.logs_) {
      logs = parsedObj.logs_.map((log: JobLog) => {
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
      jobs = parsedObj.jobs_.map((job: Record<string, any>) =>
        JobUtil.fromJson(job)
      );
    }

    const job = new Job(id, index, /* run= */ true, logs, jobs, offset, error);

    job.updateStatus(status, error);

    return job;
  }

  /**
   * Converts a parsed JSON representation of an AudienceLoadJob into a
   * proper instance of AudienceLoadJob.
   *
   * @param {!Record<string, any>} parsedObj The result of JSON.parse on the serialized JSON
   *     string representation of AudienceLoadJob
   * @returns {!AudienceLoadJob} An instance of AudienceLoadJob
   * @private
   */
  static audienceLoadJobFromJson_(parsedObj: Record<string, any>) {
    const job = JobUtil.jobFromJson_(parsedObj);
    const status = parsedObj.status_ || JobStatus.PENDING;

    const audience = new Audience({
      id: parsedObj.audience_.id_,
      name: parsedObj.audience_.name_,
      description: parsedObj.audience_.description_,
      lifeSpan: parsedObj.audience_.lifeSpan_,
      floodlightId: parsedObj.audience_.floodlightId_,
      floodlightName: parsedObj.audience_.floodlightName_,
      rules: parsedObj.audience_.rules_ || [],
      shares: parsedObj.audience_.shares_,
    });

    const extParams = {
      audience,
      idx: job.getIndex(),
    };

    const audienceLoadJob = new AudienceLoadJob(extParams, {
      id: job.getId(),
      index: job.getIndex(),
      run: true,
      logs: job.getLogs(),
      jobs: job.getJobs(),
      offset: job.getOffset(),
      error: job.getError(),
    });

    audienceLoadJob.updateStatus(status, job.getError());

    return audienceLoadJob;
  }

  /**
   * Converts a parsed JSON representation of an AudienceProcessJob into a
   * proper instance of AudienceProcessJob.
   *
   * @param {!Record<string, any>} parsedObj The result of JSON.parse on the serialized JSON
   *     string representation of AudienceProcessJob
   * @returns {!AudienceProcessJob} An instance of AudienceProcessJob
   * @private
   */
  static audienceProcessJobFromJson_(parsedObj: Record<string, any>) {
    const job = JobUtil.jobFromJson_(parsedObj);
    const status = parsedObj.status_ ?? JobStatus.PENDING;

    const audience = new Audience({
      id: parsedObj.audience_.id_,
      name: parsedObj.audience_.name_,
      description: parsedObj.audience_.description_,
      lifeSpan: parsedObj.audience_.lifeSpan_,
      floodlightId: parsedObj.audience_.floodlightId_,
      rules: parsedObj.audience_.rules_ ?? [],
      shares: parsedObj.audience_.shares_,
    });

    const extParams = {
      audience,
      actions: parsedObj.actions_,
      idx: job.getIndex(),
    };

    const audienceProcessJob = new AudienceProcessJob(extParams, {
      id: job.getId(),
      index: job.getIndex(),
      run: true,
      logs: job.getLogs(),
      jobs: job.getJobs(),
      offset: job.getOffset(),
      error: job.getError(),
    });

    audienceProcessJob.updateStatus(status, job.getError());

    return audienceProcessJob;
  }

  /**
   * Get current date and time as string.
   *
   * @returns {string}
   */
  static getCurrentDateString() {
    return new Date()
      .toISOString()
      .replace('T', ' ')
      .replace('Z', '')
      .replace(/\.\d*/, '');
  }
}
