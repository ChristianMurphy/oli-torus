defmodule OliWeb.UniconController do
  use OliWeb, :controller

  def launch(conn, %{"id_token" => id_token}) do

    params = Poison.Parser.parse!(id_token)
    url = params["https://purl.imsglobal.org/spec/lti-ags/claim/endpoint"]["lineitem"]
    token = params["https://purl.imsglobal.org/spec/lti/claim/custom"]["access_token"]

    render conn, "launch.html", url: url, token: token, title: "IFrame"
  end

end
