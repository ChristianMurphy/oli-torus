import guid from 'utils/guid';
import * as ContentModel from 'data/content/model';
import { IframeModelSchema, Parameter } from './schema';
import { RichText, ScoringStrategy } from '../types';

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

export type UserDetails = {
  name: string,
  givenName: string,
  familyName: string,
  middleName: string,
  picture: string,
  email: string,
};

export const createPostBody = (
  activityAttemptGuid: string, partAttemptGuid: string, parameters: Parameter[],
  userDetail: UserDetails) => {

  const custom = parameters.reduce((m, p) => {
    m[p.key] = p.value;
    return m;
  }, {} as any);

  return JSON.stringify({
    iss: 'https://platform.example.edu',
    sub: 'a6d5c443-1f51-4783-ba1a-7686ffe3b54a',
    aud: ['962fa4d8-bcbf-49a0-94b2-2de05ad274af'],
    exp: 1510185728,
    iat: 1510185228,
    azp: '962fa4d8-bcbf-49a0-94b2-2de05ad274af',
    nonce: 'fc5fdc6d-5dd6-47f4-b2c9-5d1216e9b771',
    name: userDetail.name,
    given_name: userDetail.givenName,
    family_name: userDetail.familyName,
    middle_name: userDetail.middleName,
    picture: userDetail.picture,
    email: userDetail.picture,
    locale: 'en-US',
    'https://purl.imsglobal.org/spec/lti/claim/deployment_id':
      '07940580-b309-415e-a37c-914d387c1150',
    'https://purl.imsglobal.org/spec/lti/claim/message_type': 'LtiResourceLinkRequest',
    'https://purl.imsglobal.org/spec/lti/claim/version': '1.3.0',
    'https://purl.imsglobal.org/spec/lti/claim/roles': [
      'http://purl.imsglobal.org/vocab/lis/v2/institution/person#Student',
      'http://purl.imsglobal.org/vocab/lis/v2/membership#Learner',
      'http://purl.imsglobal.org/vocab/lis/v2/membership#Mentor',
    ],
    'https://purl.imsglobal.org/spec/lti/claim/role_scope_mentor': [
      'fad5fb29-a91c-770-3c110-1e687120efd9',
      '5d7373de-c76c-e2b-01214-69e487e2bd33',
      'd779cfd4-bc7b-019-9bf1a-04bf1915d4d0',
    ],
    'https://purl.imsglobal.org/spec/lti/claim/context': {
      id: 'c1d887f0-a1a3-4bca-ae25-c375edcc131a',
      label: 'ECON 1010',
      title: 'Economics as a Social Science',
      type: ['http://purl.imsglobal.org/vocab/lis/v2/course#CourseOffering'],
    },
    'https://purl.imsglobal.org/spec/lti/claim/resource_link': {
      id: '200d101f-2c14-434a-a0f3-57c2a42369fd',
      description: 'Assignment to introduce who you are',
      title: 'Introduction Assignment',
    },
    'https://purl.imsglobal.org/spec/lti/claim/tool_platform': {
      guid: 'ex/48bbb541-ce55-456e-8b7d-ebc59a38d435',
      contact_email: 'support@platform.example.edu',
      description: 'Torus',
      name: 'Torus',
      url: 'https://tokamak.oli.cmu.edu',
      product_family_code: 'ExamplePlatformVendor-Product',
      version: '1.0',
    },
    'https://purl.imsglobal.org/spec/lti/claim/target_link_uri':
        'https://tool.example.com/lti/48320/ruix8782rs',
    'https://purl.imsglobal.org/spec/lti/claim/launch_presentation': {
      document_target: 'iframe',
      height: 320,
      width: 240,
      return_url: `https://tokamak.oli.cmu.edu/api/v1/attempt/activity/${activityAttemptGuid}/part/${partAttemptGuid}/outcome`,
    },
    'https://purl.imsglobal.org/spec/lti/claim/custom': custom,
    'https://purl.imsglobal.org/spec/lti/claim/lis': {
      person_sourcedid: 'example.edu:71ee7e42-f6d2-414a-80db-b69ac2defd4',
      course_offering_sourcedid: 'example.edu:SI182-F16',
      course_section_sourcedid: 'example.edu:SI182-001-F16',
    },
    'http://www.ExamplePlatformVendor.com/session': {
      id: '89023sj890dju080',
    },
  });
};
