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
 * @fileoverview This file contains tests for Job.
 */

import { Audience } from '../../src/model/audience';
import { AudienceProcessJob } from '../../src/model/audienceProcessJob';
import { Job, JobType } from '../../src/model/job';

describe('Job', () => {
  const audience = new Audience({
    id: '1',
    name: 'name',
    description: 'description',
    lifeSpan: 90,
    floodlightId: '1',
    rules: [
      {
        group: 0,
        variableName: 'NUM_EQUALS',
        variableFriendlyName: 'NUM_EQUALS',
        operator: 'NUM_EQUALS',
        value: '1',
        negation: false,
      },
      {
        group: 0,
        variableName: 'STRING_CONTAINS',
        variableFriendlyName: 'STRING_CONTAINS',
        operator: 'STRING_CONTAINS',
        value: '1',
        negation: true,
      },
    ],
    shares: [],
  });

  const audienceProcessJob = new AudienceProcessJob({
    idx: 1,
    audience: audience,
    actions: [],
  });

  it('initializes correctly', () => {
    const log = { date: new Date(), message: 'hello' };
    const innerJob = new Job();
    const job = new Job(0, 99, true, [log], [innerJob], 1, 'test');

    expect(innerJob.getId()).toBe(0);
    expect(innerJob.getIndex()).toBe(0);
    expect(innerJob.isPending()).toBe(true);
    expect(innerJob.getLogs()).toEqual([]);
    expect(innerJob.getJobs()).toEqual([]);
    expect(innerJob.getError()).toBeFalsy();
    expect(innerJob.getJobType()).toEqual(JobType.GENERIC);

    expect(job.getId()).toBe(0);
    expect(job.getIndex()).toBe(99);
    expect(job.isPending()).toBe(true);
    expect(job.getLogs()).toEqual([log]);
    expect(job.getJobs()).toEqual([innerJob]);
    expect(job.getError()).toEqual('test');
    expect(job.getJobType()).toEqual(JobType.GENERIC);
  });

  it('initializes correctly with jobs of AudienceProcessJob type', () => {
    const log = { date: new Date(), message: 'hello' };
    const job = new Job(0, 99, true, [log], [audienceProcessJob], 1, 'test');

    expect(audienceProcessJob.getId()).toBe(0);
    expect(audienceProcessJob.getIndex()).toBe(1);
    expect(audienceProcessJob.isPending()).toBe(true);
    expect(audienceProcessJob.getLogs()).toEqual([]);
    expect(audienceProcessJob.getJobs()).toEqual([]);
    expect(audienceProcessJob.getError()).toBeFalsy();
    expect(audienceProcessJob.getJobType()).toEqual(JobType.AUDIENCE_PROCESS);

    expect(job.getId()).toBe(0);
    expect(job.getIndex()).toBe(99);
    expect(job.isPending()).toBe(true);
    expect(job.getLogs()).toEqual([log]);
    expect(job.getJobs()).toEqual([audienceProcessJob]);
    expect(job.getError()).toEqual('test');
    expect(job.getJobType()).toEqual(JobType.GENERIC);
  });

  it('sets status correctly when set not to run', () => {
    const job = new Job(0, 1, false);

    expect(job.isPending()).toBe(false);
    expect(job.isComplete()).toBe(true);
  });

  it('sets status correctly when set to run', () => {
    const job = new Job(1);

    expect(job.isPending()).toBe(true);
    expect(job.isComplete()).toBe(false);
  });

  describe('method', () => {
    let job: Job;

    beforeEach(() => {
      job = new Job();
    });

    describe('run', () => {
      it('update status to RUNNING', () => {
        expect(job.isPending()).toBe(true);

        job.run();

        expect(job.isPending()).toBe(false);
        expect(job.isRunning()).toBe(true);
        expect(job.isComplete()).toBe(false);
        expect(job.isError()).toBe(false);
      });
    });

    describe('complete', () => {
      it('update status to COMPLETE', () => {
        expect(job.isPending()).toBe(true);

        job.complete();

        expect(job.isPending()).toBe(false);
        expect(job.isRunning()).toBe(false);
        expect(job.isComplete()).toBe(true);
        expect(job.isError()).toBe(false);
      });
    });

    describe('error', () => {
      it('update status to ERROR and sets the error object', () => {
        expect(job.isPending()).toBe(true);

        job.error('error');

        expect(job.isPending()).toBe(false);
        expect(job.isRunning()).toBe(false);
        expect(job.isComplete()).toBe(false);
        expect(job.isError()).toBe(true);
        expect(job.getError()).toEqual('error');
      });
    });

    describe('log', () => {
      it("appends a single log message to the job's logs", () => {
        expect(job.getLogs()).toEqual([]);

        job.log(['test']);

        expect(job.getLogs()[0].message).toBe('test');
      });

      it("appends multiple log message to the job's logs", () => {
        expect(job.getLogs()).toEqual([]);

        job.log(['test1', 'test2']);

        expect(job.getLogs()[0].message).toBe('test1');
        expect(job.getLogs()[1].message).toBe('test2');
        expect(job.getLogs()[0].date).toEqual(job.getLogs()[1].date);
      });
    });
  });
});
