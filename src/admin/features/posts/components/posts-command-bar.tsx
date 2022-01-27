import {
  CommandBar,
  ICommandBarItemProps, MessageBarType,
  NeutralColors,
  SearchBox
} from '@fluentui/react';
import React, {useMemo} from 'react';
import {useHistory} from 'react-router';
import {useDebouncedCallback} from 'use-debounce';
import {useAuth} from '@admin/features/authentication/context/auth.context';
import {usePosts} from '../context/posts.context';
import { copyToClipboard, testPaths } from '@admin/helpers/utility';
import { useSnackbar } from '@admin/context/snackbar';
import { useAllowedPaths } from '@admin/helpers/hooks';
import i18next from 'i18next';

const PostsCommandBar = () => {
  const history = useHistory();
  const {filterPermissions} = useAuth();
  const snackbar = useSnackbar();

  const {
    selectedPosts,
    getPosts,
    params,
    setParams,
    stateData,
    setStateData,
    additionalData,
  } = usePosts();

  const allowedPaths = useAllowedPaths();

  const debounced = useDebouncedCallback(async (val) => {
    setParams({
      ...(params || {}),
      search: val,
    });
    getPosts.execute({
      ...params,
      search: val,
    });
  }, 500);

  const commandItems = useMemo<ICommandBarItemProps[]>(
    () => {
      const commandBarItems: ICommandBarItemProps[] = [];

      if (additionalData?.parentId) {
        commandBarItems.push({
          key: 'back',
          text: i18next.t('command.back'),
          iconProps: {iconName: 'Back'},
          onClick: () => {
            history.push(`/sites?id=${additionalData?.parentId}`)
          }
        });
      }

      commandBarItems.push(...filterPermissions([
        {
          key: 'newItem',
          text: i18next.t('command.new'),
          'data-cy': 'post-commandBar-new',
          iconProps: {iconName: 'Add'},
          permissions: ['sites_create'],
          onClick: () => {
            setStateData('createPostOpen', true);
          },
        },
        testPaths(allowedPaths, selectedPosts?.[0]?.slugPath) ? {
            key: 'edit',
            text: i18next.t('command.edit'),
            disabled:
              selectedPosts?.length !== 1,
            iconProps: { iconName: 'Edit' },
            split: true,
            permissions: ['sites_update'],
            subMenuProps: {
              items: [
                {
                  key: 'preview',
                  text: i18next.t('command.preview'),
                  onClick: () => {
                    history.push(
                      `/sites/editor/${selectedPosts?.[0]?.id}?editor=preview`
                    );
                  },
                },
              ],
            },
            onClick: () => {
              history.push(`/sites/editor/${selectedPosts?.[0]?.id}`);
            },
          } : {
            key: 'edit',
            text: i18next.t('command.edit'),
            disabled:
              selectedPosts?.length !== 1,
            iconProps: { iconName: 'Edit' },
            permissions: ['sites_update'],
            onClick: () => {
              history.push(`/sites/editor/${selectedPosts?.[0]?.id}`);
            },
          },
        {
          key: 'settings',
          text: i18next.t('command.settings'),
          'data-cy': 'post-commandBar-settings',
          disabled:
            selectedPosts?.length !== 1 || selectedPosts?.[0]?.type === 'site',
          iconProps: {iconName: 'Settings'},
          permissions: ['sites_update'],
          onClick: () => {
            setStateData('updatePostOpen', true);
          },
        },
        {
          key: 'copyItem',
          text: i18next.t('command.duplicate'),
          'data-cy': 'post-commandBar-duplicate',
          disabled:
            selectedPosts?.length !== 1,
          iconProps: {iconName: 'Copy'},
          permissions: ['sites_create'],
          onClick: () => {
            setStateData('copyPostsOpen', true);
          },
        },
        {
          key: 'delete',
          text: i18next.t('command.delete'),
          'data-cy': 'post-commandBar-delete',
          disabled: selectedPosts?.length === 0,
          iconProps: {iconName: 'Delete'},
          permissions: ['sites_delete'],
          onClick: () => {
            setStateData('deletePostsOpen', true);
          },
        },
        {
          key: 'publish',
          text: i18next.t('command.publish'),
          'data-cy': 'post-commandBar-publish',
          disabled: selectedPosts?.length === 0,
          iconProps: {iconName: 'WebPublish'},
          permissions: ['sites_publish'],
          onClick: () => {
            setStateData('publishPostOpen', true);
          },
        },
        {
          key: 'unpublish',
          text: i18next.t('command.unpublish'),
          'data-cy': 'post-commandBar-unpublish',
          disabled: selectedPosts?.length === 0,
          iconProps: {iconName: 'UnpublishContent'},
          permissions: ['sites_publish'],
          onClick: () => {
            setStateData('unpublishPostOpen', true);
          },
        },
        {
          key: 'copyUrl',
          text: i18next.t('command.copyApiUrl'),
          iconProps: { iconName: 'ClipboardList' },
          disabled:
            selectedPosts?.length === 0,
          onClick: () => {
            const [selectedPost] = selectedPosts;
            copyToClipboard(
              `${window.location.origin}/api/content/${selectedPost.slugPath}`
            );
            snackbar.openSnackbar({
              message: i18next.t('message.copyApiUrlSuccess'),
              messageBarType: MessageBarType.success,
              duration: 1000,
            });
          },
        },
        {
          key: 'refresh',
          text: i18next.t('command.refresh'),
          'data-cy': 'post-commandBar-refresh',
          iconProps: {iconName: 'Refresh'},
          onClick: () => {
            getPosts.execute(params);
          },
        },
      ]))

      return commandBarItems;
    },
    [selectedPosts, params, stateData, additionalData]
  );

  const farToolbarItems = useMemo<ICommandBarItemProps[]>(
    () => [
      {
        key: 'search',
        onRenderIcon: () => (
          <SearchBox
            placeholder={i18next.t("sites.search")}
            onChange={(event, newValue) => {
              debounced(newValue);
            }}
          />
        ),
      },
    ],
    []
  );

  return (
    <CommandBar
      items={commandItems}
      style={{borderBottom: `1px solid ${NeutralColors.gray30}`}}
      farItems={farToolbarItems}
    />
  );
};

export default PostsCommandBar;
