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
 * @fileoverview This file encapsulates all logic for updating audiences defined
 * in the associated Google Sheets spreadsheet.
 */


/**
 * @class AudienceUpdateJobController representing a class for holding all logic
 * for handling update audience jobs triggered by the underlying jobs
 * infrastructure.
 */
class AudienceUpdateJobController {
  /**
   * @constructs an instance of AudienceUpdateJobController.
   *
   * @param {!SheetsService} sheetsService The injected SheetsService dependency
   * @param {!CampaignManagerFacade} campaignManagerService The injected
   *     CampaignManagerFacade dependency
   */
  constructor(sheetsService, campaignManagerService) {
    /** @private @const {!SheetsService} */
    this.sheetsService_ = sheetsService;

    /** @private @const {!CampaignManagerFacade} */
    this.campaignManagerService_ = campaignManagerService;
  }

  /**
   * Updates audiences changed in the underlying spreadsheet.
   *
   * @param {!Job} job The job instance passed by the jobs infrastructure
   * @param {boolean=} updateAll Optional boolean for updating all audiences
   * @param {{
   *     sheetName: string,
   *     row: number,
   *     col: number,
   *     idCol: number,
   * }=} params
   * @return {!Job} The modified job instance
   */
  updateAudiences(job, updateAll = false, {
      sheetName = CONFIG.audiences.update.sheetName,
      row = CONFIG.audiences.update.row,
      col = CONFIG.audiences.update.col,
      idCol = CONFIG.audiences.update.cols.id} = {}) {
    this.getSheetsService().showToast(
        /* message= */ 'Updating changed audiences...',
        /* title= */ 'Update');

    const remarketingLists = this.getCampaignManagerService()
        .getRemarketingLists();

    /** @type {!Object.<string, !Object>} */
    const remarketingListResourceByIdMap =
        remarketingLists.reduce((map, remarketingList) => {
          map[remarketingList.id] = remarketingList;
          return map;
        }, /* initialValue= */ {});

    const audiences = this.getSheetsService().getRangeData(sheetName, row, col);
    const jobs = audiences
        .filter((audience) => audience[idCol])
        .map((audience, index) => {
          const resource =
              remarketingListResourceByIdMap[String(audience[idCol])];
          return this.createAudienceUpdateJob(
              audience, index, resource, updateAll);
        })
        .filter(Boolean);
    job.getJobs().push(...jobs);
    return job;
  }

  /**
   * Creates an {@link AudienceUpdateJob} instance for the given audience data
   * if the data has been changed in the underlying sheet.
   *
   * @param {?Array<?Object>} audience The audience row of data from the
   *     underlying sheet
   * @param {number} idx The index of the audience in the audiences array
   * @param {!Object} remarketingListResource The remarketingList resource
   * @param {boolean=} updateAll Optional boolean for updating all audiences
   * @param {{
   *     updateVal: string,
   *     idCol: number,
   *     nameCol: number,
   *     newNameCol: number,
   *     sharesCol: number,
   *     statusCol: number,
   * }=} params
   * @return {?AudienceUpdateJob} The created AudienceUpdateJob instance or null
   *     if there were no changes
   */
  createAudienceUpdateJob(
      audience, idx, remarketingListResource, updateAll = false, {
        updateVal = CONFIG.multiSelect.modificationStatus.values.update,
        idCol = CONFIG.audiences.update.cols.id,
        nameCol = CONFIG.audiences.update.cols.name,
        newNameCol = CONFIG.audiences.update.cols.newName,
        sharesCol = CONFIG.audiences.update.cols.audienceListShares,
        statusCol = CONFIG.audiences.update.cols.status} = {}) {
    const id = String(audience[idCol]);
    const name = String(audience[nameCol]);
    const newName = String(audience[newNameCol]);
    const audienceListSharesChanged =
        (String(audience[statusCol]) === updateVal) || updateAll;

    if (newName !== name || audienceListSharesChanged) {
      console.log(`Creating job for audience "${name}"`);
      let attributes = {id: id};

      if (newName != name) {
        attributes = UriUtil
            .extend(attributes, {name: newName});
      }
      if (audienceListSharesChanged) {
        const audienceListShares = updateAll ?
            this.buildSharedAdvertiserIds() :
            this.extractSharedAdvertiserIds(String(audience[sharesCol]));
        attributes = UriUtil.extend(
            attributes, {audienceListShares: audienceListShares});
      }
      const changedAttributes = {
        id: attributes.id,
        name: attributes.name,
        audienceListShares: attributes.audienceListShares,
      };
      Object.keys(changedAttributes).forEach((key) =>
        changedAttributes[key] === undefined &&
        delete changedAttributes[key]);
      const audienceUpdateJob = new AudienceUpdateJob({
        audienceId: id,
        audienceListResource: remarketingListResource,
        changedAttributes: changedAttributes,
        idx: idx,
        shareableWithAllAdvertisers: updateAll,
      });
      return audienceUpdateJob;
    }
    return null;
  }

  /**
   * Builds an array of advertiser IDs using the data from the underlying
   * spreadsheet.
   *
   * @return {!Array<number>} The advertiser IDs array
   */
  buildSharedAdvertiserIds() {
    const result = this.buildSharedAdvertisers_(/* idsOnly= */ true);
    return result;
  }

  /**
   * Builds a string of joined shared advertiser names using the data from the
   * underlying spreadsheet.
   *
   * @return {string} A string of joined advertiser names
   */
  joinSharedAdvertisers() {
    const result = this.buildSharedAdvertisers_(/* idsOnly= */ false);
    return result;
  }

  /**
   * Extracts advertiser IDs from the given cell value. The given value is in
   * the format 'name (id)##name (id)' where ## is the separator specified in
   * {@link globals.js}.
   *
   * @param {string} audienceListSharesRaw The raw audienceListShares from the
   *     underlying spreadsheet
   * @param {string=} separatorRegex The regex to use. Defaults to the config in
   *     globals.js
   * @return {!Array<number>} An array of all extracted advertiser IDs
   */
  extractSharedAdvertiserIds(
      audienceListSharesRaw,
      separatorRegex = CONFIG.multiSelect.separatorRegex) {
    const regex = new RegExp(separatorRegex, 'g');
    const matches = audienceListSharesRaw.matchAll(regex);
    const result = [];

    for (const match of matches) {
      const res = match.toString().split(',');
      result.push(Number(res[1]));
    }
    return result;
  }

  /**
   * Updates a single audience. Triggered once for every changed audience from
   * {@link #updateAudiences}.
   *
   * @param {!AudienceUpdateJob} job The job instance passed by the jobs
   *     infrastructure
   * @return {!AudienceUpdateJob} The job instance
   */
  updateAudience(job) {
    const changedAttributes = job.getChangedAttributes();

    if (changedAttributes.name) {
      this.updateRemarketingList(job);
    }
    if (changedAttributes.audienceListShares) {
      this.updateRemarketingListShares(job);
    }
    return job;
  }

  /**
   * Updates a remarketing list with its changed attribtues.
   *
   * @param {!AudienceUpdateJob} job The job instance passed by the jobs
   *     infrastructure
   * @param {{
   *     sheetName: string,
   *     row: number,
   *     nameCol: number,
   * }=} params
   */
  updateRemarketingList(job, {
      sheetName = CONFIG.audiences.update.sheetName,
      row = CONFIG.audiences.update.row,
      nameCol = CONFIG.audiences.update.cols.name} = {}) {
    const audienceListResource = job.getAudienceListResource();
    const currentName = audienceListResource.name;
    const newName = job.getChangedAttributes().name;
    console.log(
        `Changing name from "${currentName}" to "${newName}" for ` +
        `Audience ${audienceListResource.id}`);
    audienceListResource.name = newName;

    this.getCampaignManagerService()
        .updateRemarketingList(audienceListResource);
    this.getSheetsService().setCellValue(
        row + job.getIndex(), nameCol + 1, /* val= */ newName, sheetName);

    const message = `Updated audience name from ` +
        `"${currentName}" to "${newName}" successfully!`;
    console.log(message);
    job.log([message]);
  }

  /**
   * Updates a remarketing list's shares based on the changes made in the
   * underlying sheet.
   *
   * @param {!AudienceUpdateJob} job The job instance passed by the jobs
   *     infrastructure
   * @param {{
   *     sheetName: string,
   *     updateRow: number,
   *     statusCol: number,
   *     audienceListSharesCol: number,
   *     readVal: string,
   * }=} params
   */
  updateRemarketingListShares(job, {
      sheetName = CONFIG.audiences.update.sheetName,
      updateRow = CONFIG.audiences.update.row,
      statusCol = CONFIG.audiences.update.cols.status,
      audienceListSharesCol = CONFIG.audiences.update.cols.audienceListShares,
      readVal = CONFIG.multiSelect.modificationStatus.values.read} = {}) {
    const audienceId = job.getAudienceId();
    const row = updateRow + job.getIndex();

    const remarketingListSharesResource = this.getCampaignManagerService()
        .getRemarketingListSharesResource(audienceId);
    remarketingListSharesResource.sharedAdvertiserIds =
        job.getChangedAttributes().audienceListShares;
    console.log('Updating list of advertisers allowed to target ' +
                `Audience ${audienceId}`);

    this.getCampaignManagerService().updateRemarketingListShares(
        audienceId, remarketingListSharesResource);
    this.getSheetsService().setCellValue(
        row, statusCol + 1, /* val= */ readVal, sheetName);

    if (job.isShareableWithAllAdvertisers()) {
      this.getSheetsService().setCellValue(
          row,
          audienceListSharesCol + 1,
          /* val= */ this.joinSharedAdvertisers(),
          sheetName);
    }
    const message = 'List of advertisers for audience ' +
        `${audienceId} updated successfully!`;
    console.log(message);
    job.log([message]);
  }

  /**
   * Builds an array of shared advertiser IDs or names based on the idsOnly
   * boolean and either returns the array of IDs or a joined string
   * representation of the names.
   *
   * @param {boolean} idsOnly Whether to retrieve only the advertiser IDs or the
   *     names (which implicitly contain the IDs)
   * @param {{
   *     sheetName: string,
   *     row: number,
   *     col: number,
   *     separator: string,
   * }=} params
   * @return {!Array<number>|string} The advertiser IDs array or a string
   *     representing joined advertiser names
   * @private
   */
  buildSharedAdvertisers_(idsOnly, {
    sheetName = CONFIG.advertisers.sheetName,
    row = CONFIG.advertisers.row,
    col = CONFIG.advertisers.col,
    separator = CONFIG.multiSelect.separator} = {}) {
    const advertisers = this.getSheetsService()
        .getRangeData(sheetName, row, col);
    let result = idsOnly ? [] : '';

    if (advertisers.length !== 0) {
      result = advertisers.reduce((arr, adv) => {
        if (adv.length !== 0 && adv[0] && adv[1]) {
          arr.push(idsOnly ? Number(adv[0]) : String(adv[1]));
        }
        return arr;
      }, /* initialValue= */ []);
    }
    if (!idsOnly && result) {
      result.sort();
      result = result.join(separator);
    }
    return result;
  }

  /**
   * Returns the SheetsService instance.
   *
   * @return {!SheetsService} The SheetsService instance
   */
  getSheetsService() {
    return this.sheetsService_;
  }

  /**
   * Returns the CampaignManagerFacade instance.
   *
   * @return {!CampaignManagerFacade} The CampaignManagerFacade instance
   */
  getCampaignManagerService() {
    return this.campaignManagerService_;
  }

}

