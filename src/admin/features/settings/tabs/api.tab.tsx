import React from 'react';
import Heading from '@admin/components/heading';
import { composeWrappers } from '@admin/helpers/hoc';
import AccessTokensCommandBar from '@admin/features/api-security/components/access-tokens-command-bar';
import AccessTokensList from '@admin/features/api-security/components/access-tokens-list';
import { ApiSecurityContextProvider } from '@admin/features/api-security/context/api-security.context';
import ApiAccessSettings from '@admin/features/api-security/components/api-access';
import { useTranslation } from 'react-i18next';

const ApiSettings = () => {
  const { t } = useTranslation();
  return (
    <div>
      <Heading title={t("settings.api.apiVisibility")} noPadding>
        {t('settings.api.apiVisibilityDesc')}
      </Heading>
      <ApiAccessSettings />

      <Heading title={t("settings.api.accessTokens")} noPadding>
        {t("settings.api.accessTokensDesc")}
      </Heading>
      <AccessTokensCommandBar />
      <AccessTokensList />
    </div>
  );
};

export default composeWrappers({
  apiSecurityContext: ApiSecurityContextProvider,
})(ApiSettings);
