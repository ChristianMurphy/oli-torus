defmodule OliWeb.UniconController do
  use OliWeb, :controller

  def launch(conn, %{"id_token" => id_token}) do

    params = Poison.Parser.parse!(id_token)
    url = params["https://purl.imsglobal.org/spec/lti-ags/claim/endpoint"]["lineitem"]
    token = params["https://purl.imsglobal.org/spec/lti/claim/custom"]["access_token"]

    claims = Enum.map(params["https://purl.imsglobal.org/spec/lti/claim/custom"],
      fn {k, v} -> {k, v} end)
      |> Enum.filter(fn {k, _} -> k !== "access_token" end)

    render conn, "launch.html", url: url, claims: claims, token: token, title: "IFrame"
  end

end
