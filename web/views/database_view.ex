defmodule SimpleBase.DatabaseView do
  use SimpleBase.Web, :view
  use JaSerializer.PhoenixView

  attributes [:name, :db_type, :unique_identifier, :config, :inserted_at, :updated_at, :last_accessed_at]
  
  has_many :tables,
    field: :tables,
    type: "table",
    include: false

end
