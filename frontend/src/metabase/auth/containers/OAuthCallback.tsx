import type { Location } from "history";
import { useEffect, useState } from "react";
import { t } from "ttag";

import { useDispatch, useSelector } from "metabase/lib/redux";
import { getApplicationName } from "metabase/selectors/whitelabel";
import { Box, Text } from "metabase/ui";

import { loginOAuth } from "../actions";
import { AuthLayout } from "../components/AuthLayout";

interface OAuthCallbackQueryString {
  code: string;
  state?: string;
}

interface OAuthCallbackProps {
  location: Location<OAuthCallbackQueryString>;
}

export const OAuthCallback = ({
  location,
}: OAuthCallbackProps): JSX.Element => {
  const applicationName = useSelector(getApplicationName);
  const code = location?.query?.code;
  const state = location?.query?.state;

  const dispatch = useDispatch();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleOAuthLogin = async () => {
      try {
        await dispatch(loginOAuth({ code, state })).unwrap();
      } catch (err: unknown) {
        const error = err as { data?: string };
        setError(error?.data || t`An error occurred`);
      }
    };

    handleOAuthLogin();
  }, [dispatch, code, state]);

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
        {t`Signing in to ${applicationName} ...`}
      </Box>

      {error && (
        <Text role="alert" align="center" color="error">
          {error}
        </Text>
      )}
    </AuthLayout>
  );
};
