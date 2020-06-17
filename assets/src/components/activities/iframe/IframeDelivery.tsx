import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { DeliveryElement, DeliveryElementProps } from '../DeliveryElement';
import { IframeModelSchema } from './schema';
import { createPostBody, UserDetails } from './utils';
import * as ActivityTypes from '../types';


const IFrame = (props: DeliveryElementProps<IframeModelSchema>) => {

  const [posted, setPosted] = useState(false);

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
        userDetail);

      const el = document.getElementById('post');
      (el as any).id_token.value = body;
      (el as any).submit();

      setPosted(true);
    }

  });

  return (
    <div>
      <form id="post" target="activity"
        action="/protolaunch" method="POST">
        <input type="hidden" name="id_token" />
        <input type="submit" />
      </form>
      <iframe name="activity" src="#"/>
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
