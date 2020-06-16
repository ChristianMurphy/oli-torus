import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { DeliveryElement, DeliveryElementProps } from '../DeliveryElement';
import { IframeModelSchema } from './schema';
import * as ActivityTypes from '../types';

const IFrame = (props: DeliveryElementProps<IframeModelSchema>) => {

  const [posted, setPosted] = useState(false);

  useEffect(() => {

    if (!posted) {


      setPosted(true);
    }

  });

  return (
    <div>
      <iframe src={props.model.url}/>
    </div>
  );
};

export class IFrameDelivery extends DeliveryElement<IframeModelSchema> {
  render(mountPoint: HTMLDivElement, props: DeliveryElementProps<IframeModelSchema>) {
    ReactDOM.render(<IFrame {...props} />, mountPoint);
  }
}

const manifest = require('./manifest.json') as ActivityTypes.Manifest;
window.customElements.define(manifest.delivery.element, IFrameDelivery);
