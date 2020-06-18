defmodule OliWeb.AttemptController do
  use OliWeb, :controller

  alias Oli.Delivery.Attempts
  alias Oli.Delivery.Attempts.StudentInput
  alias Oli.Delivery.Sections

  def get_auth_token(conn, attempt_guid) do
    case extract_token(conn) do
      {:ok, token} -> OliWeb.Auth.ActivityToken.verify_token(token, attempt_guid)
      error -> error
    end
  end

  defp extract_token(conn) do
    case Plug.Conn.get_req_header(conn, "authorization") do
      [auth_header] -> get_token_from_header(auth_header)
       _ -> {:error, :missing_auth_header}
    end
  end

  defp get_token_from_header(auth_header) do
    {:ok, reg} = Regex.compile("Bearer\:?\s+(.*)$", "i")
    case Regex.run(reg, auth_header) do
      [_, match] -> {:ok, String.trim(match)}
      _ -> {:error, "token not found"}
    end
  end

  def save_part(conn, %{"activity_attempt_guid" => _attempt_guid, "part_attempt_guid" => part_attempt_guid, "response" => response}) do

    case Attempts.save_student_input([%{attempt_guid: part_attempt_guid, response: response}]) do
      {:ok, _} -> json conn, %{ "type" => "success"}
      {:error, _} -> error(conn, 500, "server error")
    end

  end

  def submit_part(conn, %{"activity_attempt_guid" => activity_attempt_guid, "part_attempt_guid" => attempt_guid, "input" => input}) do

    lti_params = Plug.Conn.get_session(conn, :lti_params)
    context_id = lti_params["context_id"]
    role = Oli.Delivery.Lti.parse_lti_role(lti_params["roles"])

    case Attempts.submit_part_evaluations(role, context_id, activity_attempt_guid, [%{attempt_guid: attempt_guid, input: input}]) do
      {:ok, evaluations} -> json conn, %{ "type" => "success", "evaluations" => evaluations}
      {:error, _} -> error(conn, 500, "server error")
    end

  end

  defp determine_role(user_id, context_id) do
    case Sections.is_enrolled_as?(user_id, context_id, Oli.Delivery.Sections.SectionRoles.get_by_type("student")) do
      true -> :student
      false -> :instructor
    end
  end

  def outcome(conn, %{
    "activity_attempt_guid" => activity_attempt_guid,
    "part_attempt_guid" => part_attempt_guid,
    "resultScore" => score,
    "resultMaximum" => out_of,
    "comment" => comment}) do

    case get_auth_token(conn, activity_attempt_guid) do
      {:ok, {context_id, user_id}} -> case Attempts.submit_outcome(
        determine_role(user_id, context_id), context_id, activity_attempt_guid, part_attempt_guid, score, out_of, comment) do

        {:ok, _} -> json conn, %{ "type" => "success"}
        {:error, _} -> error(conn, 500, "server error")
      end
      {:error, _} -> error(conn, 400, "client token error")
    end

  end

  def new_part(conn, %{"activity_attempt_guid" => _, "part_attempt_guid" => _attempt_guid}) do

    json conn, %{ "type" => "success"}
  end

  def get_hint(conn, %{"activity_attempt_guid" => activity_attempt_guid, "part_attempt_guid" => part_attempt_guid}) do

    case Attempts.request_hint(activity_attempt_guid, part_attempt_guid) do
      {:ok, {hint, has_more_hints}} -> json conn, %{ "type" => "success", "hint" => hint, "hasMoreHints" => has_more_hints}
      {:error, {:not_found}} -> error(conn, 404, "not found")
      {:error, {:no_more_hints}} -> json conn, %{ "type" => "success", "hasMoreHints" => false}
      {:error, _} -> error(conn, 500, "server error")
    end

  end

  def save_activity(conn, %{"activity_attempt_guid" => _attempt_guid, "partInputs" => part_inputs}) do

    parsed = Enum.map(part_inputs, fn %{"attemptGuid" => attempt_guid, "response" => response} ->
      %{attempt_guid: attempt_guid, response: response} end)

    case Attempts.save_student_input(parsed) do
      {:ok, _} -> json conn, %{ "type" => "success"}
      {:error, _} -> error(conn, 500, "server error")
    end

  end

  def submit_activity(conn, %{"activity_attempt_guid" => activity_attempt_guid, "partInputs" => part_inputs}) do

    lti_params = Plug.Conn.get_session(conn, :lti_params)
    context_id = lti_params["context_id"]
    role = Oli.Delivery.Lti.parse_lti_role(lti_params["roles"])

    parsed = Enum.map(part_inputs, fn %{"attemptGuid" => attempt_guid, "response" => input} ->
      %{attempt_guid: attempt_guid, input: %StudentInput{input: Map.get(input, "input")}} end)

    case Attempts.submit_part_evaluations(role, context_id, activity_attempt_guid, parsed) do
      {:ok, evaluations} -> json conn, %{ "type" => "success", "evaluations" => evaluations}
      {:error, _} -> error(conn, 500, "server error")
    end
  end

  def new_activity(conn, %{"activity_attempt_guid" => attempt_guid}) do

    lti_params = Plug.Conn.get_session(conn, :lti_params)
    context_id = lti_params["context_id"]

    case Attempts.reset_activity(context_id, attempt_guid) do
      {:ok, {attempt_state, model}} -> json conn, %{ "type" => "success", "attemptState" => attempt_state, "model" => model}
      {:error, _} -> error(conn, 500, "server error")
    end

  end

  defp error(conn, code, reason) do
    conn
    |> send_resp(code, reason)
    |> halt()
  end

end
