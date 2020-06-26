import React from 'react';
import { ResourceContent, Activity, ResourceContext, ActivityReference,
  createDefaultStructuredContent } from 'data/content/resource';
import { ActivityEditorMap, EditorDesc } from 'data/content/editors';
import { ActivityModelSchema } from 'components/activities/types';
import { invokeCreationFunc } from 'components/activities/creation';
import * as Persistence from 'data/persistence/activity';
import guid from 'utils/guid';

import './AddResourceContent.scss';

type AddCallback = (content: ResourceContent, a? : Activity) => void;

// Component that presents a drop down to use to add structure
// content or the any of the registered activities
export const AddResourceContent = (
  { editMode, onAddItem, editorMap, resourceContext }
  : {editMode: boolean, onAddItem: AddCallback,
    editorMap: ActivityEditorMap, resourceContext: ResourceContext }) => {

  const handleAdd = (editorDesc: EditorDesc) => {

    let model : ActivityModelSchema;
    invokeCreationFunc(editorDesc.slug, resourceContext)
      .then((createdModel) => {
        model = createdModel;
        return Persistence.create(resourceContext.projectSlug, editorDesc.slug, model);
      })
      .then((result: Persistence.Created) => {

        const resourceContent : ActivityReference = {
          type: 'activity-reference',
          id: guid(),
          activitySlug: result.revisionSlug,
          purpose: 'none',
          children: [],
        };

        const activity : Activity = {
          type: 'activity',
          activitySlug: result.revisionSlug,
          typeSlug: editorDesc.slug,
          model,
          transformed: result.transformed,
        };

        onAddItem(resourceContent, activity);
      })
      .catch((err) => {
        // console.log(err);
      });
  };

  const content = <a className="dropdown-item" key="content" href="#"
    onClick={() => onAddItem(createDefaultStructuredContent())}>Content</a>;

  const activityEntries = Object
    .keys(editorMap)
    .map((k: string) => {
      const editorDesc : EditorDesc = editorMap[k];
      return (
        <a className="dropdown-item"
          href="#"
          key={editorDesc.slug}
          onClick={handleAdd.bind(this, editorDesc)}>{editorDesc.friendlyName}</a>
      );
    });

  return (
    <div className="add-resource-content dropdown mx-1">
      <button className={`btn btn-light dropdown-toggle ${editMode ? '' : 'disabled'}`} type="button"
        id="addResourceContent" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
        <i className="fa fa-plus"></i> Add
      </button>
      <div className="dropdown-menu dropdown-menu-right" aria-labelledby="addResourceContent">
        {[content, ...activityEntries]}
      </div>
    </div>
  );
};
