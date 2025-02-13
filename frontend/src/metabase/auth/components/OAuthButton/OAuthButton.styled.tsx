import styled from "@emotion/styled";

import ExternalLink from "metabase/core/components/ExternalLink";
import Link from "metabase/core/components/Link";

export const OAuthButtonRoot = styled.div`
  display: flex;
  justify-content: center;
  flex-flow: column wrap;
  align-items: center;
`;

export const TextLink = styled(Link)`
  cursor: pointer;
  color: var(--mb-color-text-dark);

  &:hover {
    color: var(--mb-color-brand);
  }
`;

export const TextExternalLink = styled(ExternalLink)`
  cursor: pointer;
  color: var(--mb-color-text-dark);

  &:hover {
    color: var(--mb-color-brand);
  }
`;

export const CardExternalLink = styled(TextExternalLink)`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.75rem 1rem;
  background-color: var(--mb-color-bg-white);
  box-shadow: 0 3px 10px var(--mb-color-shadow);
  border-radius: 6px;
`;

export const CardText = styled.span`
  font-weight: 700;
  line-height: 1rem;
`;
