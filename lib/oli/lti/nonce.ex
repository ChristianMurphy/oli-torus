defmodule Oli.Lti.Nonce do
  use Ecto.Schema
  import Ecto.Changeset

  schema "nonce_store" do
    field :value, :string

    timestamps()
  end

  @doc false
  def changeset(nonce, attrs) do
    nonce
    |> cast(attrs, [:value])
    |> validate_required([:value])
    |> unique_constraint(:value)
  end
end