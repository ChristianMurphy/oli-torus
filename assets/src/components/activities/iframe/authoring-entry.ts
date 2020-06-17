
export { IFrameDelivery } from './IframeDelivery';
export { IFrameAuthoring } from './IframeAuthoring';

// Registers the creation function:
import { Manifest, CreationContext } from '../types';
import { registerCreationFunc } from '../creation';
import { IframeModelSchema } from './schema';
import { defaultModel } from './utils';
const manifest : Manifest = require('./manifest.json');

function createFn(content: CreationContext) : Promise<IframeModelSchema> {
  return Promise.resolve(Object.assign({}, defaultModel()));
}

registerCreationFunc(manifest, createFn);
