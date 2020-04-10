defmodule OliWeb.AuthorProjectController do
  use OliWeb, :controller
  alias Oli.AuthorsProjects

  def create(conn, %{"email" => email}) do
    project_id = conn.params["project_id"]
    case AuthorsProjects.create_author_project(email, project_id) do
      {:ok, _results} ->
        redirect conn, to: Routes.project_path(conn, :overview, project_id)
      {:error, _error} ->
        conn
          |> put_flash(:error, "Could not add author to project - are you sure the email is correct?")
          |> redirect(to: Routes.project_path(conn, :overview, project_id))
    end
  end

  def update(_conn, %{"author" => _author}) do
    # For later use -> change author role within project
  end

  def delete(conn, %{"project_id" => project_id, "author_email" => author_email}) do
    case AuthorsProjects.delete_author_project(author_email, project_id) do
      {:ok, _} ->
        redirect conn, to: Routes.project_path(conn, :overview, project_id)
      {:error, message} ->
        conn
          |> put_flash(:error, "Error: #{message}. Please try again")
          |> redirect(to: Routes.project_path(conn, :overview, project_id))
    end
  end
end