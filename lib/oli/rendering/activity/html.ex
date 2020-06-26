defmodule Oli.Rendering.Activity.Html do
  @moduledoc """
  Implements the Html writer for Oli activity rendering
  """
  alias Oli.Utils
  alias Oli.Rendering.Context
  alias Phoenix.HTML

  require Logger

  @behaviour Oli.Rendering.Activity

  def activity(%Context{activity_map: activity_map, lti_params: lti_params, render_opts: render_opts} = context, %{"activity_id" => activity_id, "purpose" => purpose} = activity) do
    activity_summary = activity_map[activity_id]

    case activity_summary do
      nil ->
        error_id = Utils.random_string(8)
        error_msg = "ActivitySummary with id #{activity_id} missing from activity_map: #{Kernel.inspect({activity, activity_map})}"
        if render_opts.log_errors, do: Logger.error("Render Error ##{error_id} #{error_msg}"), else: nil

        if render_opts.render_errors do
          error(context, activity, {:activity_missing, error_id, error_msg})
        else
          []
        end
      _ ->
        tag = activity_summary.delivery_element
        state = activity_summary.state
        graded = activity_summary.graded
        model_json = activity_summary.model
        encoded_lti = encode_object(lti_params)

        activity_html = ["<#{tag} class=\"activity\" graded=\"#{graded}\" state=\"#{state}\" model=\"#{model_json}\" ltiParams=\"#{encoded_lti}\"></#{tag}>\n"]

        case purpose do
          "none" ->
            activity_html
          _ ->
            ["<h4 class=\"activity-purpose\">", Oli.Utils.Purposes.label_for(purpose), "</h4>", activity_html]
        end
    end
  end

  def error(%Context{}, _activity, error) do
    case error do
      {:invalid, error_id, _error_msg} ->
        ["<div class=\"activity invalid\">Activity is invalid. Please contact support with issue ##{error_id}</div>\n"]
      {_, error_id, _error_msg} ->
        ["<div class=\"activity error\">This activity could not be rendered. Please contact support with issue ##{error_id}</div>\n"]
    end
  end

  defp encode_object(map) do
    case Jason.encode(map) do
      {:ok, s} -> s |> encode()
      {:error, _} -> "{ \"error\": true }" |> encode()
    end
  end

  defp encode(s) do
    {:safe, encoded} = HTML.html_escape(s)
    IO.iodata_to_binary(encoded)
  end

end
