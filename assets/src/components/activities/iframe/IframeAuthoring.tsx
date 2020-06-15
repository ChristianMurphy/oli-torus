import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { AuthoringElement, AuthoringElementProps } from '../AuthoringElement';
import { IframeModelSchema } from './schema';
import * as ActivityTypes from '../types';


const IFrame = (props: AuthoringElementProps<IframeModelSchema>) => {

  const [url, setURL] = useState(props.model.url);

  const onChange = (e: any) => {
    props.onEdit(Object.assign({}, props.model, { url: e.target.value }));
    setURL(e.target.value);
  };

  return (
    <div>
      <label>URL</label>
      <input type="text" value={url} onChange={onChange}/>
    </div>
  );
};

export class IFrameAuthoring extends AuthoringElement<IframeModelSchema> {
  render(mountPoint: HTMLDivElement, props: AuthoringElementProps<IframeModelSchema>) {
    ReactDOM.render(<IFrame {...props} />, mountPoint);
  }
}

const manifest = require('./manifest.json') as ActivityTypes.Manifest;
window.customElements.define(manifest.authoring.element, IFrameAuthoring);
