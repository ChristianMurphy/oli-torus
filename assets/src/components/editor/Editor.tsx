import React, { useMemo, useCallback, KeyboardEvent } from 'react';
import { Slate, Editable, withReact, ReactEditor } from 'slate-react';
import { createEditor, Node, NodeEntry, Range, Editor as SlateEditor, Transforms, Path } from 'slate';
import { create, Mark, ModelElement, schema, Paragraph, SchemaConfig } from 'data/content/model';
import { editorFor, markFor } from './editors';
import { ToolbarItem, CommandContext } from './interfaces';
import { FixedToolbar, HoveringToolbar } from './Toolbars';
import { onKeyDown as listOnKeyDown } from './editors/Lists';
import { onKeyDown as quoteOnKeyDown } from './editors/Blockquote';
import { getRootOfText } from './utils';

import guid from 'utils/guid';

export type EditorProps = {
  // Callback when there has been any change to the editor (including selection state)
  onEdit: (value: any) => void;

  // The content to display
  value: Node[];

  // The fixed toolbar configuration
  toolbarItems: ToolbarItem[];

  // Whether or not editing is allowed
  editMode: boolean;

  commandContext: CommandContext;
};

// Pressing the Enter key on any void block should insert an empty
// paragraph after that node
const voidOnKeyDown = (editor: ReactEditor, e: KeyboardEvent) => {

  if (e.key === 'Enter') {
    if (editor.selection !== null && Range.isCollapsed(editor.selection)) {

      getRootOfText(editor).lift((node: Node) => {

        if ((schema as any)[node.type as string].isVoid) {
          const path = ReactEditor.findPath(editor, node);
          Transforms.insertNodes(editor, create<Paragraph>(
            { type: 'p', children: [{ text: '' }], id: guid() }),
            { at: Path.next(path) });
        }
      });

    }
  }
};


function areEqual(prevProps: EditorProps, nextProps: EditorProps) {
  return prevProps.editMode === nextProps.editMode
    && prevProps.toolbarItems === nextProps.toolbarItems
    && prevProps.value === nextProps.value;
}


export const Editor = React.memo((props: EditorProps) => {

  const commandContext = props.commandContext;

  const editor = useMemo(() => withReact(createEditor()), []);

  // Override isVoid to incorporate our schema's opinion on which
  // elements are void
  editor.isVoid = (element) => {
    try {
      const result = (schema as any)[element.type as string].isVoid;
      return result;
    } catch (e) {
      return false;
    }

  };

  editor.isInline = (element) => {
    try {
      const result = (schema as any)[element.type as string].isBlock;
      return !result;
    } catch (e) {
      return false;
    }
  };

  const { normalizeNode } = editor;
  editor.normalizeNode = (entry: NodeEntry<Node>) => {

    if ((editor as any).suspendNormalization) {
      normalizeNode(entry);
      return;
    }

    try {
      const [node, path] = entry;

      // Ensure that we always have a paragraph as the last node in
      // the document, otherwise it can be impossible for a user
      // to position their cursor after the last node
      if (SlateEditor.isEditor(node)) {
        const last = node.children[node.children.length - 1];

        if (last.type !== 'p') {
          Transforms.insertNodes(editor, create<Paragraph>(
            { type: 'p', children: [{ text: '' }], id: guid() }),
            { mode: 'highest', at: SlateEditor.end(editor, []) });
        }
        return; // Return here is necessary to enable multi-pass normalization

      }

      // Check this node's parent constraints
      if (SlateEditor.isBlock(editor, node)) {
        const [parent] = SlateEditor.parent(editor, path);
        if (!SlateEditor.isEditor(parent)) {
          const config : SchemaConfig = (schema as any)[parent.type as string];
          if (!(config.validChildren as any)[node.type as string]) {
            Transforms.removeNodes(editor, { at: path });
            return; // Return here is necessary to enable multi-pass normalization
          }

        }
      }

      // Check the top-level constraints
      if (SlateEditor.isBlock(editor, node) && !(schema as any)[node.type as string].isTopLevel) {
        const [parent] = SlateEditor.parent(editor, path);
        if (SlateEditor.isEditor(parent)) {
          Transforms.removeNodes(editor, { at: path });
          return; // Return here is necessary to enable multi-pass normalization
        }
      }

    } catch (e) {
      // tslint:disable-next-line
      console.log(e);
    }

    normalizeNode(entry);

  };

  const renderElement = useCallback((props) => {
    const model = props.element as ModelElement;

    return editorFor(model, props, editor, commandContext);
  }, []);

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    voidOnKeyDown(editor, e);
    listOnKeyDown(editor, e);
    quoteOnKeyDown(editor, e);
  }, []);

  const renderLeaf = useCallback(({ attributes, children, leaf }: any) => {
    const markup =
      Object
        .keys(leaf)
        .reduce((m, k) => k !== 'text' ? markFor(k as Mark, m) : m, children);
    return <span {...attributes}>{markup}</span>;
  }, []);

  const onChange = (value: Node[]) => {
    const { operations } = editor;

    // Determine if this onChange was due to an actual content change
    if (operations.filter(({ type }) => type !== 'set_selection').length) {
      props.onEdit(value);
    }
  };

  return (
    <div>

      <Slate
        editor={editor as any}
        value={props.value}
        onChange={onChange}
        >
        <FixedToolbar toolbarItems={props.toolbarItems} commandContext={props.commandContext} />

        <HoveringToolbar commandContext={props.commandContext}/>

        <Editable
          readOnly={!props.editMode}
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          placeholder="Enter some text..."
          onKeyDown={onKeyDown}
        />
      </Slate>
    </div>
  );
}, areEqual);
