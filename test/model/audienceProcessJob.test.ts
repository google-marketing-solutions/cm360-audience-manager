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
 * @fileoverview This file contains tests for AudienceProcessJob.
 */

import { Audience, AudienceRule } from '../../src/model/audience';
import { AudienceProcessJob } from '../../src/model/audienceProcessJob';
import { JobType } from '../../src/model/job';

describe('AudienceProcessJob', () => {
  const audienceName = 'name';
  const description = 'desc';
  const lifeSpan = 90;
  const floodlightId = '1';
  const audienceRules: AudienceRule[] = [
    {
      group: 0,
      variableName: 'NUM_EQUALS',
      variableFriendlyName: 'NUM_EQUALS',
      operator: 'NUM_EQUALS',
      value: '1',
      negation: false,
    },
    {
      group: 1,
      variableName: 'STRING_CONTAINS',
      variableFriendlyName: 'STRING_CONTAINS',
      operator: 'STRING_CONTAINS',
      value: '1',
      negation: true,
    },
  ];

  const audience = new Audience({
    id: '1',
    name: audienceName,
    description: description,
    lifeSpan: lifeSpan,
    floodlightId: floodlightId,
    rules: audienceRules,
    shares: [],
  });

  it('initializes correctly', () => {
    const audienceProcessJob = new AudienceProcessJob({
      idx: 1,
      audience,
      actions: ['AUDIENCE_CREATE'],
    });

    expect(audienceProcessJob.getAudience().getName()).toEqual(audienceName);
    expect(audienceProcessJob.getAudience().getDescription()).toEqual(
      description
    );
    expect(audienceProcessJob.getAudience().getLifeSpan()).toEqual(lifeSpan);
    expect(audienceProcessJob.getAudience().getRules()).toEqual(audienceRules);
    expect(audienceProcessJob.getActions().includes('AUDIENCE_CREATE')).toBe(
      true
    );
    expect(audienceProcessJob.getJobType()).toEqual(JobType.AUDIENCE_PROCESS);
    expect(audienceProcessJob.getIndex()).toEqual(1);
  });
});
