import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { DeliveryElement, DeliveryElementProps } from '../DeliveryElement';
import { IframeModelSchema } from './schema';
import { createPostBody, PostContext } from './utils';
import guid from 'utils/guid';
import * as ActivityTypes from '../types';

// React component to render an iframe and issue a form POST to the iframe
const IFrame = (props: DeliveryElementProps<IframeModelSchema>) => {

  const [posted, setPosted] = useState(false);
  const [id, setId] = useState(guid());

  useEffect(() => {

    if (!posted && props.ltiParams !== null) {

      // Give a peek at the current activity state
      console.log(props.state);

      // Assemble the body of the POST request that will init
      // the iframe psuedo-LTI activity
      const context : PostContext = {
        name: props.ltiParams.lis_person_name_full,
        email: props.ltiParams.user_image,
        context_id: props.ltiParams.context_id,
        context_label: props.ltiParams.context_label,
        context_title: props.ltiParams.context_title,
        resource_link_id: props.ltiParams.resource_link_id,
        resource_link_title: props.ltiParams.resource_link_title,
        host: window.location.protocol + '//' + window.location.host,
      };

      const body = createPostBody(
        props.state.accessToken,
        props.state.attemptGuid,
        props.state.parts[0].attemptGuid,
        props.model.parameters,
        context);

      // Now submit the form, targeting the iframe that we have
      // rendered below
      const el = document.getElementById(id);
      (el as any).id_token.value = body;
      (el as any).submit();

      setPosted(true);
    }

  });

  let iframe = null;
  if (props.model.responsive !== '') {
    iframe = (
      <div className={'embed-responsive embed-responsive-' + props.model.responsive}>
        <iframe className="embed-responsive-item"
          name={'iframe_' + id} src="#" frameBorder="0"/>
      </div>
    );
  } else {
    iframe = <iframe height="800" width="600"
      name={'iframe_' + id} src="#" frameBorder="0"/>;
  }

  return (
    <div>
      <form id={id} target={'iframe_' + id}
        action={props.model.url} method="POST">
        <input type="hidden" name="id_token" />
      </form>
      {iframe}
    </div>
  );
};

// The web component - a thin wrapper around the underlying React component.
export class IFrameDelivery extends DeliveryElement<IframeModelSchema> {
  render(mountPoint: HTMLDivElement, props: DeliveryElementProps<IframeModelSchema>) {
    ReactDOM.render(<IFrame {...props} />, mountPoint);
  }
}

const manifest = require('./manifest.json') as ActivityTypes.Manifest;
window.customElements.define(manifest.delivery.element, IFrameDelivery);
