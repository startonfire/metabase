(ns metabase.integrations.oauth
  (:require
   [buddy.core.codecs :refer [str->bytes]]
   [buddy.core.codecs.base64 :as b64]
   [buddy.core.keys :as keys]
   [buddy.sign.jwt :as jwt]
   [cheshire.core :as json]
   [clj-http.client :as http]
   [clojure.string :as str]
   [metabase.api.common :as api]
   [metabase.config :as config]
   [metabase.integrations.oauth.interface :as oauth.i]
   [metabase.models.setting :as setting :refer [defsetting]]
   [metabase.models.setting.multi-setting
    :refer [define-multi-setting-impl]]
   [metabase.models.user :as user]
   [metabase.plugins.classloader :as classloader]
   [metabase.util :as u]
   [metabase.util.i18n :refer [deferred-tru tru]]
   [metabase.util.log :as log]
   [metabase.util.malli :as mu]
   [metabase.util.malli.schema :as ms]
   [toucan2.core :as t2]))

;; Load EE implementation if available
(when config/ee-available?
  (classloader/require 'metabase-enterprise.enhancements.integrations.oauth))

(def ^:private non-existant-account-message
  (deferred-tru "You'll need an administrator to create a Metabase account before you can use OAuth to log in."))

(defsetting oauth-provider-name
  (deferred-tru "Name of OAuth Provider.")
  :encryption :no
  :visibility :public
  :audit      :getter
  :setter     (fn [provider-name]
                (if (seq provider-name)
                  (let [trimmed-provider-name (str/trim provider-name)]
                    (setting/set-value-of-type! :string :oauth-provider-name trimmed-provider-name))
                  (do
                    (setting/set-value-of-type! :string :oauth-provider-name nil)
                    (setting/set-value-of-type! :boolean :oauth-enabled false)))))

(defsetting oauth-auth-url
  (deferred-tru "Authorize URL for OAuth Sign-In.")
  :encryption :when-encryption-key-set
  :visibility :public
  :audit      :getter
  :setter     (fn [auth-url]
                (if (seq auth-url)
                  (let [trimmed-auth-url (str/trim auth-url)]
                    (setting/set-value-of-type! :string :oauth-auth-url trimmed-auth-url))
                  (do
                    (setting/set-value-of-type! :string :oauth-auth-url nil)
                    (setting/set-value-of-type! :boolean :oauth-enabled false)))))

(defsetting oauth-token-url
  (deferred-tru "Token URL for OAuth Sign-In.")
  :encryption :when-encryption-key-set
  :visibility :public
  :audit      :getter
  :setter     (fn [token-url]
                (if (seq token-url)
                  (let [trimmed-token-url (str/trim token-url)]
                    (setting/set-value-of-type! :string :oauth-token-url trimmed-token-url))
                  (do
                    (setting/set-value-of-type! :string :oauth-token-url nil)
                    (setting/set-value-of-type! :boolean :oauth-enabled false)))))

(defsetting oauth-client-id
  (deferred-tru "Client ID for OAuth Sign-In.")
  :encryption :when-encryption-key-set
  :visibility :public
  :audit      :getter
  :setter     (fn [client-id]
                (if (seq client-id)
                  (let [trimmed-client-id (str/trim client-id)]
                    (setting/set-value-of-type! :string :oauth-client-id trimmed-client-id))
                  (do
                    (setting/set-value-of-type! :string :oauth-client-id nil)
                    (setting/set-value-of-type! :boolean :oauth-enabled false)))))

(defsetting oauth-client-secret
  (deferred-tru "Client Secret for OAuth Sign-In.")
  :encryption :when-encryption-key-set
  :visibility :public
  :audit      :getter
  :setter     (fn [client-secret]
                (if (seq client-secret)
                  (let [trimmed-client-secret (str/trim client-secret)]
                    (setting/set-value-of-type! :string :oauth-client-secret trimmed-client-secret))
                  (do
                    (setting/set-value-of-type! :string :oauth-client-secret nil)
                    (setting/set-value-of-type! :boolean :oauth-enabled false)))))

(defsetting oauth-public-key
  (deferred-tru "JWT Public Key for OAuth Sign-In.")
  :encryption :when-encryption-key-set
  :visibility :public
  :audit      :getter
  :setter     (fn [public-key]
                (if (seq public-key)
                  (let [trimmed-public-key (str/trim public-key)]
                    (setting/set-value-of-type! :string :oauth-public-key trimmed-public-key))
                  (do
                    (setting/set-value-of-type! :string :oauth-public-key nil)
                    (setting/set-value-of-type! :boolean :oauth-enabled false)))))
                    
(defsetting oauth-configured
  (deferred-tru "Is OAuth Sign-In configured?")
  :type   :boolean
  :setter :none
  :getter (fn [] (boolean (oauth-client-id))))

(defsetting oauth-enabled
  (deferred-tru "Is OAuth Sign-in currently enabled?")
  :visibility :public
  :type       :boolean
  :audit      :getter
  :getter     (fn []
                (if-some [value (setting/get-value-of-type :boolean :oauth-enabled)]
                  value
                  (boolean (oauth-client-id))))
  :setter     (fn [new-value]
                (if-let [new-value (boolean new-value)]
                  (if-not (oauth-client-id)
                    (throw (ex-info (tru "OAuth Sign-In is not configured. Please set the Client ID first.")
                                    {:status-code 400}))
                    (setting/set-value-of-type! :boolean :oauth-enabled new-value))
                  (setting/set-value-of-type! :boolean :oauth-enabled new-value))))

(def ^:private public-key
  "Load public key from string"
  (delay
    (keys/str->public-key (oauth-public-key))))

(defn decode-jwt-token
  [token]
  (try
    (let [decoded (jwt/unsign token @public-key {:alg :rs256})]
      (log/debug "Decoded JWT token:" decoded)
      decoded)
    (catch Exception e
      (log/error "Failed to decode JWT token:" (.getMessage e))
      (throw (ex-info "Invalid JWT token" 
                     {:status-code 400 
                      :error (.getMessage e)})))))

(defn- oauth-token-info
  ([token-info-response]
   (oauth-token-info token-info-response (oauth-client-id)))
  ([token-info-response client-id]
   (let [{:keys [status body]} token-info-response]
     (when-not (= status 200)
       (throw (ex-info (tru "Invalid OAuth token status") {:status-code 400})))
       (let [{:keys [access_token]} (json/parse-string body true)]
         (when-not access_token
           (throw (ex-info (tru "Invalid OAuth token") {:status-code 400})))
         (let [token-data (decode-jwt-token access_token)
            email (get token-data :email)]
            (when-not email
              (throw (ex-info (tru "Email not found in token.") {:status-code 400})))
         token-data)))))
       

(defn- english-only?
  "Check if string contains only English characters"
  [s]
  (boolean (re-matches #"^[a-zA-Z0-9]+$" s)))

(defn- split-name
  "Split display name into first and last name according to rules:
   1. If contains space: split by space, first part as first-name, rest as last-name
   2. If no space and English only: whole string as first-name, provider-name as last-name
   3. If no space and non-English: first char as last-name, rest as first-name"
  [display-name]
  (let [placeholder (oauth-provider-name)
        name-str (or display-name "")]
    (if (clojure.string/includes? name-str " ")
      ;; Case 1: Contains space
      (let [parts (clojure.string/split name-str #"\s+")]
        {:first-name (first parts)
         :last-name  (clojure.string/join " " (rest parts))})
      ;; No space cases
      (if (english-only? name-str)
        ;; Case 2: English only
        {:first-name name-str
         :last-name  placeholder}
        ;; Case 3: Non-English
        (if (> (count name-str) 1)
          {:first-name (subs name-str 1)
           :last-name  (subs name-str 0 1)}
          ;; Handle single character case
          {:first-name name-str
           :last-name  placeholder})))))
           
(mu/defn- oauth-create-new-user!
  [{:keys [email] :as new-user} :- user/NewUser]
  ;; this will just give the user a random password; they can go reset it if they ever change their mind and want to
  ;; log in without OAuth; this lets us keep the NOT NULL constraints on password / salt without having to make
  ;; things hairy and only enforce those for non-OAuth users
  (user/create-new-oauth-user! new-user))

(defn- maybe-update-oauth-user!
  "Update OAuth user if the display name changed."
  [user first-name last-name]
  (when (or (not= first-name (:first_name user))
            (not= last-name (:last_name user)))
    (t2/update! :model/User (:id user) {:first_name first-name
                                        :last_name  last-name}))
  (assoc user :first_name first-name :last_name last-name))

(mu/defn- oauth-fetch-or-create-user! :- (ms/InstanceOf :model/User)
  [display-name email]
  (let [{:keys [first-name last-name]} (split-name display-name)]
    (log/infof "split: %s %s" first-name last-name)
    (let [existing-user (t2/select-one [:model/User :id :email :last_login :first_name :last_name] :%lower.email (u/lower-case-en email))]
      (if existing-user
        (maybe-update-oauth-user! existing-user first-name last-name)
        (oauth-create-new-user! {:first_name first-name
                                :last_name  last-name
                                :email      email})))))

(defn do-oauth
  "Call to OAuth to perform an authentication"
  [{{:keys [code, state]} :body, :as _request}]
  (let [token-info-response (http/post (format "%s?grant_type=authorization_code&client_id=%s&client_secret=%s&code=%s"
                                              (oauth-token-url)
                                              (oauth-client-id)
                                              (oauth-client-secret)
                                              code))
        {:keys [displayName email]} (oauth-token-info token-info-response)]
    (log/infof "Successfully authenticated OAuth Sign-In token for: %s(%s)" displayName email)
    (api/check-500 (oauth-fetch-or-create-user! displayName email))))
