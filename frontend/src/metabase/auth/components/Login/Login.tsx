import type { Location } from "history";
import { t } from "ttag";

import { useSelector } from "metabase/lib/redux";
import type { AuthProvider } from "metabase/plugins/types";
import { getApplicationName } from "metabase/selectors/whitelabel";
import { Box } from "metabase/ui";

import {
  getAuthProviders,
  getExternalAuthProviders,
  getIsLdapEnabled,
  getIsPasswordSigninHidden,
} from "../../selectors";
import { AuthLayout } from "../AuthLayout";

interface LoginQueryString {
  redirect?: string;
}

interface LoginQueryParams {
  provider?: string;
}

interface LoginProps {
  params?: LoginQueryParams;
  location?: Location<LoginQueryString>;
}

export const Login = ({ params, location }: LoginProps): JSX.Element => {
  let providers = useSelector(getAuthProviders);

  const isPasswordSigninHidden = useSelector(getIsPasswordSigninHidden);
  const isLdapEnabled = useSelector(getIsLdapEnabled);
  const externalProviders = useSelector(getExternalAuthProviders);
  if (
    isPasswordSigninHidden &&
    !isLdapEnabled &&
    externalProviders?.length > 0
  ) {
    providers = externalProviders;
  }

  const selection = getSelectedProvider(providers, params?.provider);
  const redirectUrl = location?.query?.redirect;
  const applicationName = useSelector(getApplicationName);
  return (
    <AuthLayout>
      <Box
        role="heading"
        c="text-dark"
        fz="1.25rem"
        fw="bold"
        lh="1.5rem"
        ta="center"
      >
        {t`Sign in to ${applicationName}`}
      </Box>
      {selection && selection.Panel && (
        <Box mt="2.5rem">
          <selection.Panel redirectUrl={redirectUrl} />
        </Box>
      )}
      {!selection && (
        <Box mt="3.5rem">
          {providers.map(provider => (
            <Box key={provider.name} mt="2rem" ta="center">
              <provider.Button isCard={true} redirectUrl={redirectUrl} />
            </Box>
          ))}
        </Box>
      )}
    </AuthLayout>
  );
};

const getSelectedProvider = (
  providers: AuthProvider[],
  providerName?: string,
): AuthProvider | undefined => {
  const provider =
    providers.length > 1
      ? providers.find(p => p.name === providerName)
      : providers[0];

  return provider?.Panel ? provider : undefined;
};
