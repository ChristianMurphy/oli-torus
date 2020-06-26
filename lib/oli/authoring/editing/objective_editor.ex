defmodule Oli.Authoring.Editing.ObjectiveEditor do

  import Ecto.Query, warn: false

  alias Oli.Repo
  alias Oli.Resources
  alias Oli.Publishing
  alias Oli.Accounts.Author
  alias Oli.Authoring.Course.Project
  alias Oli.Repo
  alias Oli.Authoring.Broadcaster

  import Oli.Utils

  def add_new(attrs, %Author{} = author, %Project{} = project, container_slug \\ nil) do

    attrs = Map.merge(attrs, %{
      author_id: author.id,
      resource_type_id: Oli.Resources.ResourceType.get_id_by_type("objective")
    })

    Repo.transaction(fn ->

      with {:ok, %{resource: resource, revision: revision}} <- Oli.Authoring.Course.create_and_attach_resource(project, attrs),
          publication <- Publishing.get_unpublished_publication_by_slug!(project.slug),
          {:ok, mapping} <- Publishing.upsert_published_resource(publication, revision),
          {:ok, container} <- maybe_append_to_container(container_slug, publication, revision, project.slug, author)
      do

        Broadcaster.broadcast_resource(revision, project.slug)

        {:ok,
          %{
            resource: resource,
            revision: revision,
            project: project,
            mapping: mapping,
            container: container
          }
        }
      else
        error -> Repo.rollback(error)
      end

    end)
  end

  def edit(revision_slug, attrs, %Author{} = author, %Project{} = project) do

    attrs = Map.merge(attrs, %{
      author_id: author.id,
    })

    Repo.transaction(fn ->

      with {:ok, resource} <- Resources.get_resource_from_slug(revision_slug) |> trap_nil(),
          publication <- Publishing.get_unpublished_publication_by_slug!(project.slug),
          {:ok, revision} <- Publishing.get_published_revision(publication.id, resource.id) |> trap_nil(),
          {:ok, new_revision} <- Resources.create_revision_from_previous(revision, attrs),
          {:ok, _} <- Publishing.upsert_published_resource(publication, new_revision)
      do

        Broadcaster.broadcast_revision(new_revision, project.slug)

        {:ok, new_revision}
      else
        error -> Repo.rollback(error)
      end

    end)
  end

  def maybe_append_to_container(container_slug, publication, revision_to_attach, project_slug, author) do

    case container_slug do
      nil -> {:ok, nil}
      "" -> {:ok, nil}
      slug -> append_to_container(slug, publication, revision_to_attach, project_slug, author)
    end

  end

  def append_to_container(container_slug, publication, revision_to_attach, project_slug, author) do

    with {:ok, resource} <- Resources.get_resource_from_slug(container_slug) |> trap_nil(),
        {:ok, revision} <- Publishing.get_published_revision(publication.id, resource.id) |> trap_nil()
    do

      attrs = %{
        children: [revision_to_attach.resource_id | revision.children],
        author_id: author.id
      }
      {:ok, next} = Oli.Resources.create_revision_from_previous(revision, attrs)
      {:ok, _} = Publishing.upsert_published_resource(publication, next)

      Broadcaster.broadcast_revision(next, project_slug)

      {:ok, next}
    else
      error -> error
    end

  end

  def fetch_objective_mappings(project) do

    publication = Publishing.get_unpublished_publication_by_slug!(project.slug)
    Publishing.get_objective_mappings_by_publication(publication.id)
  end

end

