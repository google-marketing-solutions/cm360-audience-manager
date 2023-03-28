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
import { Audience } from '../../src/model/audience';
import { AudienceProcessJob } from '../../src/model/audienceProcessJob';
import { Job } from '../../src/model/job';
import { JobUtil } from '../../src/util/job';

describe('JobUtil', () => {
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
    actions: ['CREATE_AUDIENCE'],
  });

  const checkParsedJsonEquals = (job: Job, expectedJob: Job) => {
    const str = JSON.stringify(job);
    const parsedObj = JSON.parse(str);
    //assertObject(parsedObj);
    const parsedJob = JobUtil.fromJson(parsedObj);

    expect(parsedJob instanceof Job).toBe(true);
    expect(parsedJob).toEqual(expectedJob);
  };

  it('deserializes Job properly', () => {
    const job = new Job();

    checkParsedJsonEquals(job, job);
  });

  it('deserializes Job properly with all properties set', () => {
    const date = new Date();
    const logThatWontBeParsed = { date: date, message: '' };
    const expectedLogThatWontBeParsed = {
      date: date.toISOString(),
      message: '',
    };
    const logs = [{ date: date, message: 'hello' }];
    const innerJob = new Job();
    const job = new Job(
      0,
      99,
      false,
      [...logs, logThatWontBeParsed],
      [innerJob],
      1
    );
    job.complete();
    const expectedJob = new Job(
      0,
      99,
      true,
      [...logs, expectedLogThatWontBeParsed],
      [innerJob],
      1
    );
    expectedJob.complete();

    checkParsedJsonEquals(job, expectedJob);
  });

  it('deserializes Job properly with error set', () => {
    const log = { date: new Date(), message: 'hello' };
    const innerJob = new Job();
    const job = new Job(0, 99, true, [log], [innerJob], 1);
    job.error('test');
    const expectedJob = new Job(0, 99, true, [log], [innerJob], 1);
    expectedJob.error('test');

    checkParsedJsonEquals(job, expectedJob);
  });

  it('deserializes running Job properly', () => {
    const job = new Job();
    job.run();
    const expectedJob = new Job();
    expectedJob.run();

    checkParsedJsonEquals(job, expectedJob);
  });

  it('deserializes Job properly with jobs of AudienceProcessJob type', () => {
    const log = { date: new Date(), message: 'hello' };
    const job = new Job(0, 99, true, [log], [audienceProcessJob], 1, 'test');

    checkParsedJsonEquals(job, job);
    expect(job.getJobs()[0] instanceof AudienceProcessJob).toBe(true);
    expect(job.getJobs()[0]).toEqual(audienceProcessJob);
    expect(job.getJobs()[0].getIndex()).toEqual(1);
  });

  it('deserializes AudienceProcessJob properly', () => {
    const str = JSON.stringify(audienceProcessJob);
    const parsedObj = JSON.parse(str);
    //assertObject(parsedObj);
    const parsedJob = JobUtil.fromJson(parsedObj);

    expect(audienceProcessJob.getAudience().getRules().length).toEqual(2);
    expect(parsedJob instanceof AudienceProcessJob).toBe(true);
    expect(parsedJob).toEqual(audienceProcessJob);
    expect(parsedJob.getIndex()).toEqual(1);
  });

  it('deserializes AudienceProcessJob properly with error set', () => {
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

    const audienceProcessJob = new AudienceProcessJob(
      {
        idx: 1,
        audience: audience,
        actions: ['CREATE_AUDIENCE'],
      },
      {
        id: 0,
        index: 2,
        run: true,
        logs: [],
        jobs: [],
        offset: 0,
        error: 'error',
      }
    );
    audienceProcessJob.error('error');

    const str = JSON.stringify(audienceProcessJob);
    const parsedObj = JSON.parse(str);
    //assertObject(parsedObj);
    const parsedJob = JobUtil.fromJson(parsedObj);

    expect(audienceProcessJob.getAudience().getRules().length).toEqual(2);
    expect(parsedJob instanceof AudienceProcessJob).toBe(true);
    expect(parsedJob).toEqual(audienceProcessJob);
    expect(parsedJob.isError()).toBe(true);
    expect(parsedJob.getIndex()).toEqual(2);
  });
});
