import React, { useState, useRef, useEffect } from 'react';
import { ReactEditor } from 'slate-react';
import { Transforms } from 'slate';

import { updateModel, getEditMode } from './utils';
import * as ContentModel from 'data/content/model';
import { Command, CommandDesc } from '../interfaces';
import { EditorProps, CommandContext } from './interfaces';
import guid from 'utils/guid';
import * as Settings from './Settings';
import './Settings.scss';


const command: Command = {
  execute: (context, editor: ReactEditor) => {
    const src = 'zHIIzcWqsP0';

    const youtube = ContentModel.create<ContentModel.YouTube>(
      { type: 'youtube', src, children: [{ text: '' }], id: guid() });
    Transforms.insertNodes(editor, youtube);
  },
  precondition: (editor: ReactEditor) => {

    return true;
  },
};

export const commandDesc: CommandDesc = {
  type: 'CommandDesc',
  icon: 'fab fa-youtube-square',
  description: 'YouTube',
  command,
};

export interface YouTubeProps extends EditorProps<ContentModel.YouTube> {
}

const onVisit = (href: string) => {
  window.open(href, '_blank');
};

const onCopy = (href: string) => {
  navigator.clipboard.writeText(href);
};

type YouTubeSettingsProps = {
  model: ContentModel.YouTube,
  onEdit: (model: ContentModel.YouTube) => void,
  onRemove: () => void,
  commandContext: CommandContext,
  editMode: boolean,
};

const toLink = (src: string) =>
  'https://www.youtube.com/embed/' + (src === '' ? 'zHIIzcWqsP0' : src);


const YouTubeSettings = (props: YouTubeSettingsProps) => {

  // Which selection is active, URL or in course page
  const [model, setModel] = useState(props.model);

  const ref = useRef();

  useEffect(() => {

    // Inits the tooltips, since this popover rendres in a react portal
    // this was necessary
    if (ref !== null && ref.current !== null) {
      ((window as any).$('[data-toggle="tooltip"]')).tooltip();
    }
  });

  const setSrc = (src: string) => setModel(Object.assign({}, model, { src }));
  const setCaption = (caption: string) => setModel(Object.assign({}, model, { caption }));
  const setAlt = (alt: string) => setModel(Object.assign({}, model, { alt }));

  const applyButton = (disabled: boolean) => <button onClick={(e) => {
    e.stopPropagation();
    e.preventDefault();
    props.onEdit(model);
  }}
  disabled={disabled}
  className="btn btn-primary ml-1">Apply</button>;

  return (
    <div className="settings-editor-wrapper">
      <div className="settings-editor" ref={ref as any}>

        <div className="d-flex justify-content-between mb-2">
          <div>
            YouTube
          </div>

          <div>
            <Settings.Action icon="fab fa-youtube" tooltip="Open YouTube to Find a Video"
              onClick={() => onVisit('https://www.youtube.com')}/>
            <Settings.Action icon="fas fa-external-link-alt" tooltip="Open link"
              onClick={() => onVisit(toLink(model.src))}/>
            <Settings.Action icon="far fa-copy" tooltip="Copy link"
              onClick={() => onCopy(toLink(model.src))}/>
            <Settings.Action icon="fas fa-trash" tooltip="Remove YouTube Video" id="remove-button"
              onClick={() => props.onRemove()}/>
          </div>
        </div>

        <form className="form">
          <label>YouTube Video ID</label>
          <input type="text" value={model.src} onChange={e => setSrc(e.target.value)}
            className="form-control mr-sm-2"/>
          <div className="mb-2">
            <small>e.g. https://www.youtube.com/watch?v=<strong>zHIIzcWqsP0</strong></small>
          </div>

          <label>Caption</label>
          <input type="text" value={model.caption} onChange={e => setCaption(e.target.value)}
            className="form-control mr-sm-2"/>

          <label>Alt Text</label>
          <input type="text" value={model.alt} onChange={e => setAlt(e.target.value)}
            className="form-control mr-sm-2"/>
        </form>

        {applyButton(!props.editMode)}

      </div>
    </div>
  );
};

export const YouTubeEditor = (props: YouTubeProps) => {

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const { attributes, children, editor, model } = props;

  const editMode = getEditMode(editor);

  // Note that it is important that any interactive portions of a void editor
  // must be enclosed inside of a "contentEditable=false" container. Otherwise,
  // slate does some weird things that non-deterministically interface with click
  // events.

  const { src } = model;
  const fullSrc = 'https://www.youtube.com/embed/' + (src === '' ? 'zHIIzcWqsP0' : src);

  const onEdit = (updated: ContentModel.YouTube) => {
    updateModel<ContentModel.YouTube>(editor, model, updated);

    setIsPopoverOpen(false);
  };

  const onRemove = () => {
    ($('#remove-button') as any).tooltip('hide');

    const path = ReactEditor.findPath(editor, model);
    Transforms.removeNodes(editor, { at: path });

    setIsPopoverOpen(false);
  };

  const contentFn = () => <YouTubeSettings
    model={model}
    editMode={editMode}
    commandContext={props.commandContext}
    onRemove={onRemove}
    onEdit={onEdit}/>;

  return (
    <div {...attributes} className="ml-4 mr-4">

      <div contentEditable={false} style={{ userSelect: 'none' }} className="youtube-editor">

        <div className="embed-responsive embed-responsive-16by9 img-thumbnail">
          <iframe className="embed-responsive-item"
            src={fullSrc} allowFullScreen></iframe>
        </div>
        <Settings.ToolPopupButton
          contentFn={contentFn}
          setIsPopoverOpen={setIsPopoverOpen}
          isPopoverOpen={isPopoverOpen} />
        <Settings.Caption caption={model.caption}/>

      </div>

      {children}
    </div>
  );
};
