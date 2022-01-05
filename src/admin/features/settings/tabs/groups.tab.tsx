import React from 'react';
import GroupList from '@admin/features/groups/components/group-list';
import GroupCommandBar from '@admin/features/groups/components/group-command-bar';
import Heading from '@admin/components/heading';
import GroupAdd from '@admin/features/groups/components/group-add';
import { PermissionsContextProvider } from '@admin/features/permissions/context/permissions.context';
import GroupEdit from '@admin/features/groups/components/group-edit';
import { Route } from 'react-router';
import { composeWrappers } from '@admin/helpers/hoc';
import { GroupsContextProvider } from '@admin/features/groups/context/groups.context';
import { useTranslation } from 'react-i18next';

const GroupSettings = () => {
  const { t } = useTranslation();
  return (
    <div>
      <Heading title={t("settings.tabs.groups")}>
        {t('settings.groups.desc')}
      </Heading>
      <div>
        <GroupCommandBar />
        <GroupList />
        <PermissionsContextProvider>
          <Route path="/settings/groups/add" component={GroupAdd} />
          <Route path="/settings/groups/edit/:id" component={GroupEdit} />
        </PermissionsContextProvider>
      </div>
    </div>
  );
};

export default composeWrappers({
  groupsContext: GroupsContextProvider,
})(GroupSettings);
