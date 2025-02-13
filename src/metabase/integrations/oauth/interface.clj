(ns metabase.integrations.oauth.interface
  (:require
   [metabase.models.setting.multi-setting :refer [define-multi-setting]]
   [metabase.premium-features.core :as premium-features]
   [metabase.util.i18n :refer [deferred-tru]]))
