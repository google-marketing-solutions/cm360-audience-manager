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
import { Job, JobType, JobParams } from './job';

/**
 * AudienceProcessJob representing the definition of a more specific Job
 * type that is used for audience process jobs.
 */
export class AudienceProcessJob extends Job {
  private readonly audience_: Audience;
  private readonly actions_: string[];
  protected readonly type: JobType = JobType.AUDIENCE_PROCESS;

  /**
   * @constructs an instance of AudienceProcessJob.
   *
   * @param {{
   *   idx: number,
   *   audience: !Audience,
   *   actions: string[],
   * }} extParams
   * @param {JobParams=} baseParams
   */
  constructor(
    {
      idx,
      audience,
      actions,
    }: { idx: number; audience: Audience; actions: string[] },
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
    this.actions_ = actions;
  }

  /**
   * Returns the audience.
   *
   * @returns {!Audience} The audience
   */
  getAudience() {
    return this.audience_;
  }

  /**
   * Return actions.
   *
   * @returns {!Array<string>} The actions
   */
  getActions() {
    return this.actions_;
  }
}
