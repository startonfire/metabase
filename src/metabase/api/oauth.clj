(ns metabase.api.oauth
  "/api/oauth endpoints"
  (:require
   [metabase.api.common :as api]
   [metabase.api.macros :as api.macros]
   [metabase.integrations.oauth :as oauth]
   [metabase.models.setting :as setting]
   [toucan2.core :as t2]))

(api.macros/defendpoint :put "/settings"
  "Update OAuth Sign-In related settings. You must be a superuser to do this."
  [_route-params
   _query-params
   {:keys [oauth-provider-name oauth-auth-url oauth-token-url oauth-client-id oauth-client-secret oauth-public-key oauth-enabled]}
   :- [:map
       [:oauth-provider-name {:optional true} [:maybe :string]]
       [:oauth-auth-url      {:optional true} [:maybe :string]]
       [:oauth-token-url     {:optional true} [:maybe :string]]
       [:oauth-client-id     {:optional true} [:maybe :string]]
       [:oauth-client-secret {:optional true} [:maybe :string]]
       [:oauth-public-key    {:optional true} [:maybe :string]]
       [:oauth-enabled       {:optional true} [:maybe :boolean]]]]
  (api/check-superuser)
  ;; Set oauth-enabled in a separate step because it requires the client ID to be set first
  (t2/with-transaction [_conn]
    (setting/set-many! {:oauth-provider-name oauth-provider-name
                        :oauth-auth-url      oauth-auth-url
                        :oauth-token-url     oauth-token-url
                        :oauth-client-id     oauth-client-id
                        :oauth-client-secret oauth-client-secret
                        :oauth-public-key    oauth-public-key})
    (oauth/oauth-enabled! oauth-enabled)))
