import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { DeliveryElement, DeliveryElementProps } from '../DeliveryElement';
import { IframeModelSchema } from './schema';
import { createPostBody, UserDetails } from './utils';
import guid from 'utils/guid';
import * as ActivityTypes from '../types';

// React component to render an iframe and issue a form POST to the iframe
const IFrame = (props: DeliveryElementProps<IframeModelSchema>) => {

  const [posted, setPosted] = useState(false);
  const [id, setId] = useState(guid());

  useEffect(() => {

    if (!posted && props.ltiParams !== null) {

      const userDetail : UserDetails = {
        name: props.ltiParams.lis_person_name_full,
        givenName: props.ltiParams.lis_person_name_given,
        familyName: props.ltiParams.lis_person_name_family,
        middleName: props.ltiParams.lis_person_name_full,
        picture: props.ltiParams.lis_person_name_full,
        email: props.ltiParams.user_image,
      };

      const body = createPostBody(
        props.state.attemptGuid,
        props.state.parts[0].attemptGuid,
        props.model.parameters,
        userDetail);

      const el = document.getElementById(id);
      (el as any).id_token.value = body;
      (el as any).submit();

      setPosted(true);
    }

  });

  return (
    <div>
      <form id={id} target={'iframe_' + id}
        action={props.model.url} method="POST">
        <input type="hidden" name="id_token" />
      </form>
      <iframe name={'iframe_' + id} src="#"/>
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
