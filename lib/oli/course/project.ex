defmodule Oli.Course.Project do
  use Ecto.Schema
  import Ecto.Changeset

  alias Oli.Utils.Slug

  @derive {Phoenix.Param, key: :slug}
  schema "projects" do
    field :description, :string
    field :slug, :string
    field :title, :string
    field :version, :string

    belongs_to :parent_project, Oli.Course.Project, foreign_key: :project_id
    belongs_to :family, Oli.Course.Family
    many_to_many :authors, Oli.Accounts.Author, join_through: Oli.Accounts.AuthorProject

    timestamps()
  end

  @doc false
  def changeset(project, attrs \\ %{}) do
    project
      |> cast(attrs, [:title, :slug, :description, :version, :family_id, :project_id])
      |> validate_required([:title, :slug, :version, :family_id])
      |> Slug.maybe_update_slug("projects")
  end

end