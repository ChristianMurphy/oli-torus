
import { Part, Transformation, ActivityModelSchema } from '../types';

export interface IframeModelSchema extends ActivityModelSchema {
  url: string,
  authoring: {
    parts: Part[];
    transformations: Transformation[];
  };
}

export interface ModelEditorProps {
  model: IframeModelSchema;
  editMode: boolean;
}
