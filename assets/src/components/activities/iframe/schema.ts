
import { Part, Transformation, ActivityModelSchema } from '../types';

export interface Parameter {
  key: string;
  value: string;
  guid: string;
}

export interface IframeModelSchema extends ActivityModelSchema {
  url: string;
  parameters: Parameter[];
  authoring: {
    parts: Part[];
    transformations: Transformation[];
  };
}

export interface ModelEditorProps {
  model: IframeModelSchema;
  editMode: boolean;
}
