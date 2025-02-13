import { connect } from "metabase/lib/redux";
import { getSetting } from "metabase/selectors/settings";
import type { State } from "metabase-types/store";

import { updateOAuthSettings } from "../../../settings";
import OAuthForm from "../../components/OAuthForm";

const mapStateToProps = (state: State) => ({
  isEnabled: getSetting(state, "oauth-enabled"),
  isSsoEnabled: getSetting(state, "token-features").sso_oauth,
});

const mapDispatchToProps = {
  onSubmit: updateOAuthSettings,
};

// eslint-disable-next-line import/no-default-export -- deprecated usage
export default connect(mapStateToProps, mapDispatchToProps)(OAuthForm);
