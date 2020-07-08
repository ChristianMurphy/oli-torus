defmodule OliWeb.Projects.ProjectsLive do

  @moduledoc """
  LiveView implementation of projects view.
  """

  use Phoenix.LiveView, layout: {OliWeb.LayoutView, "live.html"}

  alias Oli.Authoring.Course
  alias Oli.Accounts.{Author}
  alias OliWeb.Projects.Table
  alias OliWeb.Projects.Cards
  alias OliWeb.Projects.State
  alias OliWeb.Router.Helpers, as: Routes
  alias Oli.Repo
  alias Oli.Accounts


  def mount(_, %{"current_author_id" => author_id}, socket) do

    author = Repo.get(Author, author_id)
    projects = Course.get_projects_for_author(author)
    author_projects = Accounts.project_authors(Enum.map(projects, fn %{id: id} -> id end))

    {:ok, assign(socket, State.initialize_state(author, projects, author_projects))}
  end

  def handle_params(%{"display_mode" => display_mode}, _, socket) do
    display_mode =
      case display_mode do
        display_mode when display_mode in ~w(cards table) -> display_mode
        _ -> socket.assigns.display_mode
      end
    {:noreply, assign(socket, display_mode: display_mode)}
  end

  def handle_params(params, _, socket) do

    sort_by =
      case params["sort_by"] do
        sort_by when sort_by in ~w(title created author) -> sort_by
        _ -> socket.assigns.sort_by
      end

    sort_order =
      case params["sort_order"] do
        sort_order when sort_order in ~w(asc desc) -> sort_order
        _ -> socket.assigns.sort_order
      end

    {:noreply, assign(socket, State.sort_projects(socket.assigns, sort_by, sort_order))}
  end


  def render(assigns) do
    ~L"""
    <div class="projects-title-row">
      <h4>My Projects</h4>
      <span class="display-modes">
        <i class="material-icons <%= active_display_mode(@display_mode, "cards") %>" phx-click="display_mode" phx-value-display_mode="cards">apps</i>
        <i class="material-icons <%= active_display_mode(@display_mode, "table") %>" phx-click="display_mode" phx-value-display_mode="table">view_headline</i>
      </span>
    </div>
    <%= case @display_mode do %>
      <% "cards" -> %>
        <%= live_component @socket, Cards, projects: @projects, authors: @authors %>
      <% "table" -> %>
        <div class="container">
          <div class="row">
            <div class="col-12">
              <%= live_component @socket, Table, projects: @projects, authors: @authors, sort_by: @sort_by, sort_order: @sort_order %>
            </div>
          </div>
        </div>
    <% end %>
    """
  end

  def handle_event("display_mode", %{"display_mode" => display_mode}, socket) do
    cond do
      display_mode == socket.assigns.display_mode -> {:noreply, socket}
      true -> {:noreply, push_patch(socket, to: Routes.live_path(socket, OliWeb.Projects.ProjectsLive, %{display_mode: display_mode}))}
    end
  end

  # handle change of selection
  def handle_event("sort", %{"sort_by" => sort_by}, socket) do

    sort_order = case socket.assigns.sort_by do
      ^sort_by -> if socket.assigns.sort_order == "asc" do "desc" else "asc" end
      _ -> socket.assigns.sort_order
    end

    {:noreply, push_patch(socket, to: Routes.live_path(socket, OliWeb.Projects.ProjectsLive, %{sort_by: sort_by, sort_order: sort_order}))}
  end

  def active_display_mode(actual, target) do
    if actual == target
    do "active-display-mode"
    else nil
    end
  end

end
