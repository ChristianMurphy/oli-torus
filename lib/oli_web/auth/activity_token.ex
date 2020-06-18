defmodule OliWeb.Auth.ActivityToken do

  @moduledoc """
  Generates and validates signed API tokens used by activity implementations.

  The token is constructed in a way that makes it unique to the activity attempt.

  The token also includes in it the user id and the context id - the information
  necessasry to be able to process the request.
  """

  @signing_salt "activity api authentication"

  @doc """
  Generate a
  """
  def generate_token(attempt_guid, user_id, context_id) do
    Phoenix.Token.sign(OliWeb.Endpoint, @signing_salt, {attempt_guid, user_id, context_id})
  end

  @doc """
  Verify a token, ensuring that it is no older than one day, and that it is
  indeed a token for this particular attempt.  This logic ensures that a client
  cannot maliciously take one token from another activity or attempt and reuse it
  in another context.
  """
  def verify_token(token, attempt_guid) do
    case Phoenix.Token.verify(OliWeb.Endpoint, @signing_salt, token, max_age: 86400) do
      {:ok, {^attempt_guid, user_id, context_id}} -> {:ok, {user_id, context_id}}
      {:ok, _} -> {:error, {:incorrect_token}}
      _ -> {:error, {:invalid_token}}
    end
  end

end
