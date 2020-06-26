defmodule OliWeb.RevisionHistory.Table do
  use Phoenix.LiveComponent

  def render(assigns) do

    range = Range.new(assigns.page_offset, assigns.page_offset + assigns.page_size)
    to_display = Enum.slice(assigns.revisions, range)

    ~L"""
    <table class="table table-hover table-bordered table-sm">
      <thead class="thead-dark">
        <tr><th>Id</th><th>Created</th><th>Updated</th><th>Author</th><th>Graded</th><th>Attempts</th><th>Slug</th></tr>
      </thead>
      <tbody id="revisions">
      <%= for rev <- to_display do %>
        <%= if rev == @selected do %>
        <tr id="<%= rev.id %>" class="table-active">
        <% else %>
        <tr id="<%= rev.id %>" style="cursor: pointer;" phx-click="select" phx-value-rev="<%= rev.id %>">
        <% end %>
        <td><%= rev.id %></td>
        <td><%= rev.inserted_at %></td>
        <td><%= rev.updated_at %></td>
        <td><%= rev.author_id %></td>
        <td><%= rev.graded %></td>
        <td><%= rev.max_attempts %></td>
        <td><%= rev.slug %></td>
        </tr>
      <% end %>
      </tbody>
    </table>
    """
  end
end
