import guid from 'utils/guid';
import * as ContentModel from 'data/content/model';
import { IframeModelSchema } from './schema';
import { RichText, ScoringStrategy } from '../types';

export const makeResponse = (rule: string, score: number, text: '') =>
  ({ id: guid(), rule, score, feedback: fromText(text) });

export const defaultMCModel : () => IframeModelSchema = () => {

  return {
    url: '',
    authoring: {
      parts: [{
        id: '1',
        scoringStrategy: ScoringStrategy.average,
        responses: [
          makeResponse('input like {.*}', 1, ''),
        ],
        hints: [],
      }],
      transformations: [],
    },
  };
};

export function fromText(text: string): { id: string, content: RichText } {
  return {
    id: guid() + '',
    content: [
      ContentModel.create<ContentModel.Paragraph>({
        type: 'p',
        children: [{ text }],
        id: guid() + '',
      }),
    ],
  };
}

export const feedback = (text: string, match: string | number, score: number = 0) => ({
  ...fromText(text),
  match,
  score,
});

export const initialize = (url: string) => {



};
