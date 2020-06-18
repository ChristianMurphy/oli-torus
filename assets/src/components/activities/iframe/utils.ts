import guid, { createRFC4122Guid } from 'utils/guid';
import * as ContentModel from 'data/content/model';
import { IframeModelSchema, Parameter } from './schema';
import { RichText, ScoringStrategy } from '../types';
import { secondsSinceEpoch } from 'utils/time';

export const makeResponse = (rule: string, score: number, text: '') =>
  ({ id: guid(), rule, score, feedback: fromText(text) });

export const defaultModel : () => IframeModelSchema = () => {

  return {
    url: '',
    parameters: [],
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

export type PostContext = {
  name: string,
  email: string,
  context_id: string,
  context_label: string,
  context_title: string,
  resource_link_id: string,
  resource_link_title: string,
  host: string,
};

export const createPostBody = (
  accessToken: string,
  activityAttemptGuid: string,
  partAttemptGuid: string,
  parameters: Parameter[],
  context: PostContext) => {

  const custom = parameters.reduce((m, p) => {
    m[p.key] = p.value;
    return m;
  }, { access_token: accessToken } as any);

  const now = secondsSinceEpoch();

  return JSON.stringify({
    iss: context.host,
    aud: ['162fa4d8-bcbf-49a0-94b2-2de05ad274af'],
    iat: now,
    exp: now,
    nonce: createRFC4122Guid(),
    sub: 'a6d5c443-1f51-4783-ba1a-7686ffe3b54a',
    name: context.name,
    email: context.email,
    locale: 'en-US',
    'https://purl.imsglobal.org/spec/lti/claim/deployment_id':
      '07940580-b309-415e-a37c-914d387c1150',
    'https://purl.imsglobal.org/spec/lti/claim/message_type': 'LtiResourceLinkRequest',
    'https://purl.imsglobal.org/spec/lti/claim/version': '1.3.0',
    'https://purl.imsglobal.org/spec/lti/claim/roles': [
      'http://purl.imsglobal.org/vocab/lis/v2/institution/person#Student',
    ],
    'https://purl.imsglobal.org/spec/lti/claim/context': {
      id: context.context_id,
      label: context.context_label,
      title: context.context_title,
      type: ['http://purl.imsglobal.org/vocab/lis/v2/course#CourseOffering'],
    },
    'https://purl.imsglobal.org/spec/lti/claim/resource_link': {
      id: context.resource_link_id,
      description: '',
      title: context.resource_link_title,
    },
    'https://purl.imsglobal.org/spec/lti-ags/claim/endpoint': {
      scope: [
        'https://purl.imsglobal.org/spec/lti-ags/scope/lineitem',
        'https://purl.imsglobal.org/spec/lti-ags/scope/result.readonly',
        'https://purl.imsglobal.org/spec/lti-ags/scope/score',
      ],
      lineitems: context.host + `/api/v1/attempt/activity/${activityAttemptGuid}/part/${partAttemptGuid}/outcome`,
      lineitem: context.host + `/api/v1/attempt/activity/${activityAttemptGuid}/part/${partAttemptGuid}/outcome`,
    },
    'https://purl.imsglobal.org/spec/lti/claim/custom': custom,
  });
};
