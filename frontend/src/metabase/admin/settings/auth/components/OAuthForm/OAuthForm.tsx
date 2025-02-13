import { useMemo } from "react";
import { t } from "ttag";
import _ from "underscore";

import Breadcrumbs from "metabase/components/Breadcrumbs";
import FormErrorMessage from "metabase/core/components/FormErrorMessage";
import FormInput from "metabase/core/components/FormInput";
import FormSubmitButton from "metabase/core/components/FormSubmitButton";
import FormTextArea from "metabase/core/components/FormTextArea";
import { FormProvider } from "metabase/forms";
import type { SettingDefinition, Settings } from "metabase-types/api";

import { OAUTH_SCHEMA } from "../../constants";

import {
  OAuthForm,
  OAuthFormCaption,
  OAuthFormHeader,
} from "./OAuthForm.styled";

const ENABLED_KEY = "oauth-enabled";
const PROVIDER_NAME_KEY = "oauth-provider-name";
const AUTH_URL_KEY = "oauth-auth-url";
const TOKEN_URL_KEY = "oauth-token-url";
const CLIENT_ID_KEY = "oauth-client-id";
const CLIENT_SECRET_KEY = "oauth-client-secret";
const PUBLIC_KEY_KEY = "oauth-public-key";

const BREADCRUMBS = [
  [t`Authentication`, "/admin/settings/authentication"],
  [t`OAuth Sign-In`],
];

export interface OAuthSettingsFormProps {
  elements?: SettingDefinition[];
  settingValues?: Partial<Settings>;
  isEnabled: boolean;
  onSubmit: (settingValues: Partial<Settings>) => void;
}

const OAuthSettingsForm = ({
  elements = [],
  settingValues = {},
  isEnabled,
  onSubmit,
}: OAuthSettingsFormProps): JSX.Element => {
  const settings = useMemo(() => {
    return _.indexBy(elements, "key");
  }, [elements]);

  const initialValues = useMemo(() => {
    const values = OAUTH_SCHEMA.cast(settingValues, { stripUnknown: true });
    return { ...values, [ENABLED_KEY]: true };
  }, [settingValues]);

  return (
    <FormProvider
      initialValues={initialValues}
      enableReinitialize
      validationSchema={OAUTH_SCHEMA}
      validationContext={settings}
      onSubmit={onSubmit}
    >
      {({ dirty }) => (
        <OAuthForm disabled={!dirty}>
          <Breadcrumbs crumbs={BREADCRUMBS} />
          <OAuthFormHeader>{t`Sign in with OAuth`}</OAuthFormHeader>
          <OAuthFormCaption>
            {t`Allows users with existing Metabase accounts to login with a OAuth account that matches their email address.`}
          </OAuthFormCaption>
          <FormInput
            name={PROVIDER_NAME_KEY}
            title={t`Provider Name`}
            placeholder={"User Center"}
            {...getFormFieldProps(settings[PROVIDER_NAME_KEY])}
          />
          <FormInput
            name={AUTH_URL_KEY}
            title={t`Authorize URL`}
            placeholder={"https://mycompany.com/login/oauth/authorize"}
            {...getFormFieldProps(settings[AUTH_URL_KEY])}
          />
          <FormInput
            name={TOKEN_URL_KEY}
            title={t`Token URL`}
            placeholder={"https://mycompany.com/api/login/oauth/access_token"}
            {...getFormFieldProps(settings[TOKEN_URL_KEY])}
          />
          <FormInput
            name={CLIENT_ID_KEY}
            title={t`Client ID`}
            placeholder={t`your client id`}
            {...getFormFieldProps(settings[CLIENT_ID_KEY])}
          />
          <FormInput
            name={CLIENT_SECRET_KEY}
            title={t`Client Secret`}
            placeholder={t`your client secret`}
            {...getFormFieldProps(settings[CLIENT_SECRET_KEY])}
          />
          <FormTextArea
            name={PUBLIC_KEY_KEY}
            spellCheck={false}
            title={t`JWT Public Key`}
            placeholder={t`-----BEGIN PUBLIC KEY-----\nyour public key\n-----END PUBLIC KEY-----`}
            {...getFormFieldProps(settings[PUBLIC_KEY_KEY])}
          />
          <FormSubmitButton
            title={isEnabled ? t`Save changes` : t`Save and enable`}
            primary
            disabled={!dirty}
          />
          <FormErrorMessage />
        </OAuthForm>
      )}
    </FormProvider>
  );
};

const getFormFieldProps = (setting?: SettingDefinition) => {
  if (setting?.is_env_setting) {
    return { placeholder: t`Using ${setting.env_name}`, readOnly: true };
  }
};

// eslint-disable-next-line import/no-default-export -- deprecated usage
export default OAuthSettingsForm;
