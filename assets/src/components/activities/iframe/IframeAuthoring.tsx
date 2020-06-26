import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { AuthoringElement, AuthoringElementProps } from '../AuthoringElement';
import { IframeModelSchema, Parameter } from './schema';
import * as ActivityTypes from '../types';
import guid from 'utils/guid';


const LabelledInput = ({ label, value, onEdit } : any) => {

  const [current, setCurrent] = useState(value);

  return (
    <div className="input-group">
      <div className="input-group-prepend">
        <span className="input-group-text">{label}</span>
      </div>
      <input type="text" value={current}
        onChange={(e: any) => { setCurrent(e.target.value); onEdit(e.target.value); }}
        className="form-control"/>
    </div>
  );
};

const ParameterEditor = ({ parameter, onEdit, onRemove } : any) => {

  return (
    <form className="form-inline">
      <LabelledInput label="Key" value={parameter.key}
        onEdit={(key : string) => onEdit(Object.assign({}, parameter, { key }))}/>

      <LabelledInput label="Value" value={parameter.value}
        onEdit={(value : string) => onEdit(Object.assign({}, parameter, { value }))}/>


      <button className="btn btn-danger ml-2"
        onClick={(e: any) => { e.preventDefault(); onRemove(); }}>
        <span><i className="fa fa-trash" aria-hidden="true"></i>
        </span>
      </button>
    </form>
  );
};

const IFrame = (props: AuthoringElementProps<IframeModelSchema>) => {

  const [model, setModel] = useState(props.model);

  const onChange = (e: any) => {
    const model = Object.assign({}, props.model, { url: e.target.value });
    props.onEdit(model);
    setModel(model);
  };

  const onResponsive = (e: any) => {
    const model = Object.assign({}, props.model, { responsive: e.target.value });
    props.onEdit(model);
    setModel(model);
  };

  const onEditParameter = (index: number, p: Parameter) => {

    const parameters = [...model.parameters];
    parameters[index] = p;
    const updated = Object.assign({}, model, { parameters });
    props.onEdit(updated);
    setModel(updated);
  };

  const onRemoveParameter = (index: number) => {

    const parameters = [...model.parameters];
    parameters.splice(index, 1);
    const updated = Object.assign({}, model, { parameters });
    props.onEdit(updated);
    setModel(updated);
  };

  const onAddParameter = () => {

    const parameters = [...model.parameters, { key: '', value: '', guid: guid() }];
    const updated = Object.assign({}, model, { parameters });
    props.onEdit(updated);
    setModel(updated);
  };

  return (
    <div>
      <label>URL</label>
      <input className="form-control mb-4"  type="text" value={model.url} onChange={onChange}/>

      <label>Responsiveness (try <code>16by9</code>)</label>
      <input className="form-control mb-4"
        type="text" value={model.responsive} onChange={onResponsive}/>

      <label>Parameters</label>
      {model.parameters.map((p, i) =>
        <ParameterEditor
          key={p.guid}
          parameter={p}
          onEdit={onEditParameter.bind(this, i)} onRemove={onRemoveParameter.bind(this, i)}/>)}

      <button
        onClick={() => onAddParameter()}
        className="btn btn-sm btn-secondary mt-2">Add Parameter</button>
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
