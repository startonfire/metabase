import { t } from "ttag";

import { useSelector } from "metabase/lib/redux";
import * as Urls from "metabase/lib/urls";

import {
  getOAuthAuthUrl,
  getOAuthClientId,
  getOAuthProviderName,
  getSiteLocale,
} from "../../selectors";

import {
  CardExternalLink,
  CardText,
  OAuthButtonRoot,
  TextLink,
} from "./OAuthButton.styled";

interface OAuthButtonProps {
  redirectUrl?: string;
  isCard?: boolean;
}

export const OAuthButton = ({ redirectUrl, isCard }: OAuthButtonProps) => {
  const providerName = useSelector(getOAuthProviderName);
  const authUrl = useSelector(getOAuthAuthUrl);
  const clientId = useSelector(getOAuthClientId);
  const locale = useSelector(getSiteLocale);

  return (
    <OAuthButtonRoot>
      {isCard && authUrl && clientId ? (
        <CardExternalLink
          target="_self"
          href={Urls.oauth(authUrl, clientId, Urls.oauthCallback(), locale)}
        >
          <CardText>{t`Sign in with ${providerName || "OAuth"}`}</CardText>
        </CardExternalLink>
      ) : (
        <TextLink to={Urls.login(redirectUrl)}>
          {t`Sign in with ${providerName || "OAuth"}`}
        </TextLink>
      )}
    </OAuthButtonRoot>
  );
};
