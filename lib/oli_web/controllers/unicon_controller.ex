defmodule OliWeb.UniconController do
  use OliWeb, :controller

  def launch(conn, %{"id_token" => id_token}) do
    render conn, "launch.html", params: id_token, title: "IFrame"
  end


end
