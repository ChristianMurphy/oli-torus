# This file is responsible for configuring your application
# and its dependencies with the aid of the Mix.Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.

# General application configuration
use Mix.Config

default_sha = if Mix.env == :dev, do: "DEV BUILD", else: "UNKNOWN BUILD"
config :oli,
  ecto_repos: [Oli.Repo],
  build: %{
    version: Mix.Project.config[:version],
    sha: System.get_env("SHA", default_sha),
    date: DateTime.now!("Etc/UTC"),
    env: Mix.env,
  },
  local_activity_manifests: Path.wildcard(File.cwd! <> "/assets/src/components/activities/*/manifest.json")
    |> Enum.map(&File.read!/1)

https = case System.get_env("ENABLE_HTTPS", "true") do
  "true" -> [
      :inet6,
      port: 443,
      otp_app: :oli,
      keyfile: System.get_env("SSL_KEY_PATH", "priv/ssl/localhost.key"),
      certfile: System.get_env("SSL_CERT_PATH", "priv/ssl/localhost.crt"),
    ]
  _ -> nil
end

force_ssl = case {System.get_env("ENABLE_HTTPS", "true"), System.get_env("FORCE_SSL", "true")} do
  {"true", "true"} -> [rewrite_on: [:x_forwarded_proto]]
  _ -> nil
end

# Configures the endpoint
config :oli, OliWeb.Endpoint,
  http: [:inet6, port: String.to_integer(System.get_env("PORT") || "4000")],
  url: [host: System.get_env("HOST") || "localhost"],
  https: https,
  force_ssl: force_ssl,
  live_view: [signing_salt: System.get_env("LIVE_VIEW_SALT") || "LIVE_VIEW_SALT"],
  render_errors: [view: OliWeb.ErrorView, accepts: ~w(html json)],
  pubsub_server: Oli.PubSub

config :ex_aws,
  access_key_id: [{:system, "AWS_ACCESS_KEY_ID"}, :instance_role],
  secret_access_key: [{:system, "AWS_SECRET_ACCESS_KEY"}, :instance_role]

# Configures Elixir's Logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Use Jason for JSON parsing in Phoenix
config :phoenix, :json_library, Jason

# Configure OAuth
config :ueberauth, Ueberauth,
  providers: [
    google: {Ueberauth.Strategy.Google, [default_scope: "email profile", callback_params: ["type"]]},
    facebook: {Ueberauth.Strategy.Facebook, [default_scope: "email,public_profile", callback_params: ["type"]]},
    identity: {Ueberauth.Strategy.Identity, [
      callback_methods: ["POST"],
      uid_field: :email,
      request_path: "/auth/identity",
      callback_path: "/auth/identity/callback",
    ]}
  ]

config :ueberauth, Ueberauth.Strategy.Google.OAuth,
  client_id: System.get_env("GOOGLE_CLIENT_ID"),
  client_secret: System.get_env("GOOGLE_CLIENT_SECRET")

config :ueberauth, Ueberauth.Strategy.Facebook.OAuth,
  client_id: System.get_env("FACEBOOK_CLIENT_ID"),
  client_secret: System.get_env("FACEBOOK_CLIENT_SECRET")

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{Mix.env()}.exs"
