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
import { Audience } from './audience';
import { Job, JobParams, JobType } from './job';

/**
 * AudienceLoadJob representing the definition of a more specific Job
 * type that is used for audience load jobs.
 */
export class AudienceLoadJob extends Job {
  private readonly audience_: Audience;
  protected readonly type: JobType = JobType.AUDIENCE_LOAD;

  /**
   * @constructs an instance of AudienceLoadJob.
   *
   * @param {{
   *   idx: number,
   *   audience: !Audience
   * }} extParams
   * @param {JobParams=} baseParams
   */
  constructor(
    { idx, audience }: { idx: number; audience: Audience },
    baseParams?: JobParams
  ) {
    super(
      baseParams?.id,
      baseParams?.index ?? idx,
      baseParams?.run,
      baseParams?.logs,
      baseParams?.jobs,
      baseParams?.offset,
      baseParams?.error
    );

    this.audience_ = audience;
  }

  /**
   * Returns the Audience.
   *
   * @returns {!Audience} The Audience
   */
  getAudience() {
    return this.audience_;
  }
}
