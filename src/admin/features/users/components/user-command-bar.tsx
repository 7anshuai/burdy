import React, { useMemo } from 'react';
import {
  CommandBar,
  ICommandBarItemProps,
  ICommandBarProps,
  NeutralColors,
  SearchBox,
} from '@fluentui/react';
import { useHistory } from 'react-router';
import { useUsers } from '@admin/features/users/context/users.context';
import { useAuth } from '@admin/features/authentication/context/auth.context';
import { useDialog } from '@admin/context/dialog';
import { IUser, UserStatus } from '@shared/interfaces/model';
import { useAsync } from '@fluentui/react-hooks';
import { useTranslation } from 'react-i18next';

type ColumnType =
  | 'add'
  | 'edit'
  | 'activate'
  | 'deactivate'
  | 'delete'
  | 'refresh'
  | 'search';

export interface IUserCommandBarProps extends Partial<ICommandBarProps> {
  visibleColumns?: ColumnType[];
}

const UserCommandBar: React.FC<IUserCommandBarProps> = ({
  visibleColumns = [
    'add',
    'edit',
    'activate',
    'deactivate',
    'delete',
    'refresh',
    'search',
  ],
  ...props
}) => {
  const history = useHistory();
  const dialog = useDialog();
  const {
    updateMany,
    selectedUsers,
    deleteMany,
    list,
    setListParams,
    listParams,
  } = useUsers();
  const { user, filterPermissions } = useAuth();
  const debouncedSearch = useAsync().debounce((search: string) => {
    setListParams({ ...listParams, search });
  }, 300);
  const { t } = useTranslation();

  const toolbarItems = useMemo<ICommandBarItemProps[]>(
    () =>
      filterPermissions([
        {
          key: 'add',
          text: t('command.add'),
          permissions: ['users_administration'],
          'data-cy': 'users-commandBar-add',
          iconProps: {
            iconName: 'Add',
          },
          onClick: () => history.push('/users/add'),
        },
        {
          key: 'edit',
          text: t('command.edit'),
          'data-cy': 'users-commandBar-edit',
          iconProps: {
            iconName: 'Edit',
          },
          disabled: selectedUsers.length !== 1,
          onClick: () => {
            const [selectedUser] = selectedUsers;
            history.push(`/users/edit/${selectedUser.id}`);
          },
        },
        {
          key: 'activate',
          text: t('command.activate'),
          permissions: ['users_administration'],
          'data-cy': 'users-commandBar-activate',
          disabled:
            selectedUsers.length === 0 ||
            !selectedUsers.some((u) => u.status === 'disabled') ||
            selectedUsers.some((u) => u.id === user.id),
          onClick: async () => {
            try {
              await dialog.confirm(
                t('users.activate'),
                t('message.areYouSure')
              );
              await updateMany.execute(
                selectedUsers.map<Partial<IUser>>(({ id }) => ({
                  id,
                  status: UserStatus.ACTIVE,
                }))
              );
            } catch (e) {
              //
            }
          },
          iconProps: {
            iconName: 'UserFollowed',
          },
        },
        {
          key: 'deactivate',
          text: t('command.deactivate'),
          permissions: ['users_administration'],
          'data-cy': 'users-commandBar-deactivate',
          disabled:
            selectedUsers.length === 0 ||
            !selectedUsers.some((u) => u.status === 'active') ||
            selectedUsers.some((u) => u.id === user.id),
          onClick: async () => {
            try {
              await dialog.confirm(
                t('command.deactivate'),
                t('message.areYouSure')
              );
              await updateMany.execute(
                selectedUsers.map<Partial<IUser>>(({ id }) => ({
                  id,
                  status: UserStatus.DISABLED,
                }))
              );
            } catch (e) {
              //
            }
          },
          iconProps: {
            iconName: 'UserRemove',
          },
        },
        {
          key: 'delete',
          text: t('command.delete'),
          permissions: ['users_administration'],
          'data-cy': 'users-commandBar-delete',
          disabled:
            selectedUsers.length === 0 ||
            selectedUsers.some((u) => u.id === user.id),
          onClick: async () => {
            try {
              await dialog.confirm(
                t('users.delete'),
                t('messag.areYouSure')
              );
              await deleteMany.execute(selectedUsers.map(({ id }) => id));
            } catch (e) {
              //
            }
          },
          iconProps: {
            iconName: 'Delete',
          },
        },
        {
          key: 'refresh',
          text: t('command.refresh'),
          'data-cy': 'users-commandBar-refresh',
          iconProps: { iconName: 'Refresh' },
          onClick: () => {
            list.execute();
          },
        },
      ].filter(({ key }) => visibleColumns.includes(key as ColumnType))),
    [selectedUsers, user, visibleColumns]
  );

  const farToolbarItems = useMemo<ICommandBarItemProps[]>(
    () =>
      filterPermissions([
        {
          key: 'search',
          permissions: ['users_administration'],
          'data-cy': 'users-commandBar-search',
          onRenderIcon: () => (
            <SearchBox
              placeholder={t("users.search")}
              onChange={(event, newValue) => debouncedSearch(newValue)}
            />
          ),
        },
      ].filter(({ key }) => visibleColumns.includes(key as ColumnType))),
    [visibleColumns]
  );

  return (
    <CommandBar
      items={toolbarItems}
      farItems={farToolbarItems}
      style={{ borderBottom: `1px solid ${NeutralColors.gray30}` }}
      {...props}
    />
  );
};

export default UserCommandBar;
