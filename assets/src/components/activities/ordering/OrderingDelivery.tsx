import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import {
  DeliveryElement,
  DeliveryElementProps,
  EvaluationResponse,
  RequestHintResponse,
  ResetActivityResponse,
} from '../DeliveryElement';
import { OrderingModelSchema } from './schema';
import * as ActivityTypes from '../types';
import { HtmlContentModelRenderer } from 'data/content/writers/renderer';
import { Stem } from '../common/DisplayedStem';
import { Hints } from '../common/DisplayedHints';
import { Reset } from '../common/Reset';
import { Evaluation } from '../common/delivery/evaluation/Evaluation';
import { IconCorrect, IconIncorrect } from 'components/misc/Icons';
import { defaultWriterContext, WriterContext } from 'data/content/writers/context';

type Evaluation = {
  score: number;
  outOf: number;
  feedback: ActivityTypes.RichText;
};

// [id, index]
type Selection = [ActivityTypes.ChoiceId, number];

interface SelectionProps {
  selected: Selection[];
  onDeselect: (id: ActivityTypes.ChoiceId) => void;
  isEvaluated: boolean;
}

const Selection = ({ selected, onDeselect, isEvaluated }: SelectionProps) => {
  const id = (selection: Selection) => selection[0];
  const index = (selection: Selection) => selection[1];
  return (
    <div className="mb-2" style={{ height: 34, borderBottom: '3px solid #333' }}>
      {selected.map((selection) => (
        <button
          key={id(selection)}
          onClick={() => onDeselect(id(selection))}
          disabled={isEvaluated}
          className="choice-index mr-1"
        >
          {index(selection) + 1}
        </button>
      ))}
    </div>
  );
};

interface ChoicesProps {
  choices: ActivityTypes.Choice[];
  selected: ActivityTypes.ChoiceId[];
  context: WriterContext;
  onSelect: (id: string) => void;
  isEvaluated: boolean;
}

const Choices = ({ choices, selected, context, onSelect, isEvaluated }: ChoicesProps) => {
  const isSelected = (choiceId: string) => !!selected.find((s) => s === choiceId);
  return (
    <div className="choices" aria-label="ordering choices">
      {choices.map((choice, index) => (
        <Choice
          key={choice.id}
          onClick={() => onSelect(choice.id)}
          selected={isSelected(choice.id)}
          choice={choice}
          context={context}
          isEvaluated={isEvaluated}
          index={index}
        />
      ))}
    </div>
  );
};

interface ChoiceProps {
  choice: ActivityTypes.Choice;
  index: number;
  selected: boolean;
  context: WriterContext;
  onClick: () => void;
  isEvaluated: boolean;
}

const Choice = ({ choice, index, selected, context, onClick, isEvaluated }: ChoiceProps) => {
  return (
    <div
      key={choice.id}
      aria-label={`choice ${index + 1}`}
      onClick={isEvaluated ? undefined : onClick}
      className={`choice ${selected ? 'selected' : ''}`}
    >
      <span className="choice-index">{index + 1}</span>
      <HtmlContentModelRenderer text={choice.content} context={context} />
    </div>
  );
};

export const OrderingComponent = (props: DeliveryElementProps<OrderingModelSchema>) => {
  const [model, setModel] = useState(props.model);
  const [attemptState, setAttemptState] = useState(props.state);
  const [hints, setHints] = useState(props.state.parts[0].hints);
  const [hasMoreHints, setHasMoreHints] = useState(props.state.parts[0].hasMoreHints);
  const [selected, setSelected] = useState<ActivityTypes.ChoiceId[]>(
    props.state.parts[0].response === null
      ? []
      : props.state.parts[0].response.input
          .split(' ')
          .reduce(
            (acc: ActivityTypes.ChoiceId[], curr: ActivityTypes.ChoiceId) => acc.concat([curr]),
            [],
          ),
  );

  const { stem, choices } = model;

  const isEvaluated = attemptState.score !== null;
  const orderedChoiceIds = (newSelection: string | undefined) =>
    newSelection === undefined ? selected.join(' ') : selected.concat(newSelection).join(' ');

  const writerContext = defaultWriterContext({ sectionSlug: props.sectionSlug });

  const onSubmit = () => {
    props
      .onSubmitActivity(attemptState.attemptGuid, [
        {
          attemptGuid: attemptState.parts[0].attemptGuid,
          response: { input: orderedChoiceIds(undefined) },
        },
      ])
      .then((response: EvaluationResponse) => {
        if (response.actions.length > 0) {
          const action: ActivityTypes.FeedbackAction = response
            .actions[0] as ActivityTypes.FeedbackAction;
          const { score, out_of, feedback, error } = action;
          const parts = [Object.assign({}, attemptState.parts[0], { feedback, error })];
          const updated = Object.assign({}, attemptState, { score, outOf: out_of, parts });
          setAttemptState(updated);
        }
      });
  };

  const updateSelection = (id: string) => {
    // eslint-disable-next-line
    const newSelection = !!selected.find((s) => s === id)
      ? selected.filter((s) => s !== id)
      : selected.concat([id]);
    setSelected(newSelection);
  };

  const onSelect = (id: string) => {
    // Update local state by adding or removing the id
    updateSelection(id);

    // Post the student response to save it
    // Here we will make a list of the selected ids like { input: [id1, id2, id3].join(' ')}
    // Then in the rule evaluator, we will say
    // `input like id1 && input like id2 && input like id3`
    props.onSaveActivity(attemptState.attemptGuid, [
      {
        attemptGuid: attemptState.parts[0].attemptGuid,
        response: { input: orderedChoiceIds(id) },
      },
    ]);
  };

  const onRequestHint = () => {
    props
      .onRequestHint(attemptState.attemptGuid, attemptState.parts[0].attemptGuid)
      .then((state: RequestHintResponse) => {
        if (state.hint !== undefined) {
          setHints([...hints, state.hint] as any);
        }
        setHasMoreHints(state.hasMoreHints);
      });
  };

  const onReset = () => {
    props.onResetActivity(attemptState.attemptGuid).then((state: ResetActivityResponse) => {
      setSelected([]);
      setAttemptState(state.attemptState);
      setModel(state.model as OrderingModelSchema);
      setHints([]);
      setHasMoreHints(props.state.parts[0].hasMoreHints);
    });
  };

  const evaluationSummary = isEvaluated ? (
    <Evaluation key="evaluation" attemptState={attemptState} context={writerContext} />
  ) : null;

  const reset =
    isEvaluated && !props.graded ? (
      <div className="d-flex my-3">
        <div className="flex-fill"></div>
        <Reset hasMoreAttempts={attemptState.hasMoreAttempts} onClick={onReset} />
      </div>
    ) : null;

  const ungradedDetails = props.graded
    ? null
    : [
        evaluationSummary,
        <Hints
          key="hints"
          onClick={onRequestHint}
          hints={hints}
          hasMoreHints={hasMoreHints}
          isEvaluated={isEvaluated}
          context={writerContext}
        />,
      ];

  const gradedDetails = props.graded && props.review ? [evaluationSummary] : null;

  const correctnessIcon = attemptState.score === 0 ? <IconIncorrect /> : <IconCorrect />;

  const gradedPoints =
    props.graded && props.review
      ? [
          <div key="reviewed" className=" text-info font-italic">
            {correctnessIcon}
            <span> Points: </span>
            <span>{attemptState.score + ' out of ' + attemptState.outOf}</span>
          </div>,
        ]
      : null;

  const maybeSubmitButton = props.graded ? null : (
    <button
      aria-label="submit"
      className="btn btn-primary mt-2 float-right"
      disabled={isEvaluated || selected.length !== choices.length}
      onClick={onSubmit}
    >
      Submit
    </button>
  );

  return (
    <div className={`activity ordering-activity ${isEvaluated ? 'evaluated' : ''}`}>
      <div className="activity-content">
        <div>
          <Stem stem={stem} context={writerContext} />
          {gradedPoints}
          <Selection
            onDeselect={(id: ActivityTypes.ChoiceId) => updateSelection(id)}
            selected={selected.map((s) => [s, choices.findIndex((c) => c.id === s)])}
            isEvaluated={isEvaluated}
          />
          <Choices
            choices={choices}
            selected={selected}
            onSelect={onSelect}
            isEvaluated={isEvaluated}
            context={writerContext}
          />
          {maybeSubmitButton}
        </div>
        {ungradedDetails}
        {gradedDetails}
      </div>
      {reset}
    </div>
  );
};

// Defines the web component, a simple wrapper over our React component above
export class OrderingDelivery extends DeliveryElement<OrderingModelSchema> {
  render(mountPoint: HTMLDivElement, props: DeliveryElementProps<OrderingModelSchema>) {
    ReactDOM.render(<OrderingComponent {...props} />, mountPoint);
  }
}

// Register the web component:
// eslint-disable-next-line
const manifest = require('./manifest.json') as ActivityTypes.Manifest;
window.customElements.define(manifest.delivery.element, OrderingDelivery);
