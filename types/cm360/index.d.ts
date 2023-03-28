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

declare namespace GoogleAppsScript {
  namespace CampaignManager {
    interface UserDefinedVariableConfiguration {
      variableType: string;
      reportName: string;
    }

    interface FloodlightConfiguration {
      userDefinedVariableConfigurations: UserDefinedVariableConfiguration[];
    }

    interface ListPopulationTerm {
      variableName: string;
      type: string;
      operator: string;
      value: string;
      negation: boolean;
    }

    interface ListPopulationClause {
      terms: ListPopulationTerm[];
    }

    interface ListPopulationRule {
      floodlightActivityId?: string;
      listPopulationClauses?: ListPopulationClause[];
    }

    interface RemarketingList {
      id?: string;
      advertiserId?: string;
      name: string;
      description: string;
      lifeSpan: number;
      listPopulationRule?: ListPopulationRule;
      active: boolean;
      listSource: string;
      [key: string]: unknown;
    }

    interface RemarketingListShare {
      remarketingListId: string;
      sharedAdvertiserIds: string[];
    }

    interface UserProfile {
      accountId: string;
      profileId: string;
    }

    interface UserProfiles {
      list(): {
        items: UserProfile[];
      };
    }

    interface FloodlightConfigurations {
      get(
        profileId: string,
        advertiserId: string
      ): {
        userDefinedVariableConfigurations: UserDefinedVariableConfiguration[];
      };
    }

    interface FloodlightConfiguration {
      userDefinedVariableConfigurations: UserDefinedVariableConfiguration[];
    }

    interface FloodlightActivity {
      id: string;
      name: string;
    }

    interface FloodlightActivities {
      list(
        profileId: string,
        options: Record<string, string>
      ): {
        floodlightActivities: FloodlightActivity[];
      };
    }

    interface Advertiser {
      id: string;
      name: string;
    }

    interface Advertisers {
      list(
        profileId: string,
        params: Record<string, unknown>
      ): {
        nextPageToken: string;
        advertisers: Advertiser[];
      };
    }

    interface RemarketingLists {
      list(
        profileId: string,
        advertiserId: string
      ): {
        remarketingLists: RemarketingList[];
      };
      update(resource: RemarketingList, profileId: string): RemarketingList;
      insert(resource: RemarketingList, profileId: string): RemarketingList;
      get(profileId: string, remarketingListId: string): RemarketingList;
    }

    interface RemarketingListShares {
      get(profileId: string, remarketingListId: string): RemarketingListShare;
      patch(
        resource: RemarketingListShare,
        profileId: string,
        id: string
      ): RemarketingListShare;
    }

    interface CampaignManager {
      FloodlightConfigurations: FloodlightConfigurations;
      FloodlightActivities: FloodlightActivities;
      UserProfiles: UserProfiles;
      Advertisers: Advertisers;
      RemarketingLists: RemarketingLists;
      RemarketingListShares: RemarketingListShares;
      newRemarketingList(): RemarketingList;
    }
  }
}

// eslint-disable-next-line no-var
declare var CampaignManager: GoogleAppsScript.CampaignManager.CampaignManager;
