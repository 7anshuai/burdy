import { Pivot, PivotItem } from '@fluentui/react';
import React, { useMemo } from 'react';
import GroupSettings from '@admin/features/settings/tabs/groups.tab';
import { useHistory, useRouteMatch } from 'react-router';
import GeneralSettings from '@admin/features/settings/tabs/general.tab';
import Hooks from '@shared/features/hooks';
import { useAuth } from '@admin/features/authentication/context/auth.context';
import ErrorBoundary from '@admin/components/error-boundary';
import BackupSettings from "@admin/features/settings/tabs/backup.tab";
import ApiSettings from '@admin/features/settings/tabs/api.tab';
import PreviewEditorTab from '@admin/features/settings/tabs/preview.tab';
import { useTranslation } from 'react-i18next';

const Settings = () => {
  const history = useHistory();
  const { params } = useRouteMatch<any>('/settings/:id?');
  const { filterPermissions } = useAuth();
  const { t } = useTranslation();

  const items = useMemo(() => {
    const predefined = [
      {
        key: 'general',
        name: t('settings.tabs.general'),
        permissions: ['settings'],
        component: GeneralSettings
      },
      {
        key: 'backups',
        name: t('settings.tabs.backups'),
        permissions: ['all'],
        component: BackupSettings,
      },
      {
        key: 'groups',
        name: t('settings.tabs.groups'),
        permissions: ['users_administration'],
        component: GroupSettings
      },
      {
        key: 'api',
        name: t('settings.tabs.apiAndSecurity'),
        permissions: ['all'],
        component: ApiSettings
      },
      {
        key: 'preview-editor',
        name: t('settings.tabs.previewEditor'),
        permissions: ['all'],
        component: PreviewEditorTab
      }
    ];

    return filterPermissions(
      Hooks.applySyncFilters('admin/settings/tabs', predefined)
    );
  }, []);

  return (
    <div style={{ padding: '1rem 2rem' }}>
      <Pivot
        aria-label='Settings pivot'
        selectedKey={params?.id ?? 'general'}
        onLinkClick={(item) => history.push(`/settings/${item.props.itemKey}`)}
      >
        {items.map((item) => (
          <PivotItem key={item.key} headerText={item.name} itemKey={item.key}>
            <ErrorBoundary message={t('message.pageError', { name: item.name })}>
              {item?.component && <item.component />}
            </ErrorBoundary>
          </PivotItem>
        ))}
      </Pivot>
    </div>
  );
};

export default Settings;
