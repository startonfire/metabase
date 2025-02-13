import { updateIn } from "icepick";

import OAuthCard from "metabase/admin/settings/auth/containers/OAuthCard";
import OAuthSettingsForm from "metabase/admin/settings/auth/containers/OAuthForm";
import MetabaseSettings from "metabase/lib/settings";
import {
  PLUGIN_ADMIN_SETTINGS_UPDATES,
  PLUGIN_AUTH_PROVIDERS,
  PLUGIN_IS_PASSWORD_USER,
} from "metabase/plugins";

PLUGIN_AUTH_PROVIDERS.push(providers => {
  const oauthProvider = {
    name: "oauth",
    // circular dependencies
    Button: require("metabase/auth/components/OAuthButton").OAuthButton,
  };

  return MetabaseSettings.isOAuthEnabled()
    ? [oauthProvider, ...providers]
    : providers;
});

PLUGIN_ADMIN_SETTINGS_UPDATES.push(sections =>
  updateIn(sections, ["authentication", "settings"], settings => [
    ...settings,
    {
      key: "oauth-enabled",
      description: null,
      noHeader: true,
      widget: OAuthCard,
    },
  ]),
);

PLUGIN_ADMIN_SETTINGS_UPDATES.push(sections => ({
  ...sections,
  "authentication/oauth": {
    component: OAuthSettingsForm,
    settings: [
      { key: "oauth-provider-name" },
      { key: "oauth-auth-url" },
      { key: "oauth-token-url" },
      { key: "oauth-client-id" },
      { key: "oauth-client-secret" },
      { key: "oauth-public-key" },
    ],
  },
}));

PLUGIN_IS_PASSWORD_USER.push(user => !user.oauth);
