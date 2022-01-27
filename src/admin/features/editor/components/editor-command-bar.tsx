import {
  CommandBar,
  ICommandBarItemProps,
  IconButton, MessageBarType,
  NeutralColors,
  Shimmer,
  ShimmerElementType,
  Stack
} from '@fluentui/react';
import React, { useEffect, useMemo } from 'react';
import { useHistory, useLocation } from 'react-router';
import queryString from 'query-string';
import i18next from 'i18next';
import { usePosts } from '../../posts/context/posts.context';
import { useAuth } from '@admin/features/authentication/context/auth.context';
import { copyToClipboard } from '@admin/helpers/utility';
import { useSnackbar } from '@admin/context/snackbar';

export interface EditorCommandBarProps {
  handleSubmit: any;
  editor?: string;
  toggleMenu?: (val: boolean) => void;
  menuOpened?: boolean;
  device?: string;
  onDeviceChange?: (device: string) => void;
  loading?: boolean;
  enableEditor?: boolean;
}

const EditorCommandBar: React.FC<EditorCommandBarProps> = ({
  handleSubmit,
  editor,
  device,
  onDeviceChange,
  menuOpened,
  toggleMenu,
  loading,
  enableEditor
}) => {
  const { getPost, post, updatePost, updatePostContent, publishPosts, setStateData, stateData, getVersionsCount, loadingContent } =
    usePosts();

  const history = useHistory();
  const location = useLocation();

  const snackbar = useSnackbar();

  const { filterPermissions } = useAuth();

  useEffect(() => {
    if (post?.id) {
      getVersionsCount.execute(post?.id);
    }
  }, [post]);

  const apiLoading = updatePost.loading || updatePostContent?.loading || publishPosts?.loading || loadingContent;

  const commandItems = useMemo<ICommandBarItemProps[]>(() => {
    const items: ICommandBarItemProps[] = [
      {
        key: 'back',
        text: i18next.t('command.back'),
        'data-cy': 'editor-commandBar-back',
        iconProps: { iconName: 'Back' },
        onClick: () => {
          if (post?.type === 'post' && post?.parentId) {
            history.push(`/sites/post-container/${post.parentId}`);
          } else {
            history.push({
              pathname: '/sites',
              search: queryString.stringify({ id: post?.id }),
            });
          }
        },
      },
    ];

    if (enableEditor && !loading) {
      items.push({
        key: 'switchEditor',
        text:
          editor === 'preview'
            ? i18next.t('editor.preview')
            : i18next.t('editor.headless'),
        iconProps: { iconName: 'ChangeEntitlements' },
        subMenuProps: {
          items: [
            {
              key: 'headless',
              text: i18next.t('editor.headless'),
              onClick: () => {
                history.push({
                  search: queryString.stringify({
                    ...(queryString.parse(location.search) || {}),
                    editor: undefined,
                  }),
                });
              },
            },
            {
              key: 'preview',
              text: i18next.t('editor.preview'),
              onClick: () => {
                history.push({
                  search: queryString.stringify({
                    ...(queryString.parse(location.search) || {}),
                    editor: 'preview',
                  }),
                });
              },
            },
          ],
        },
      });
    }

    if (enableEditor && editor === 'preview' && !loading) {
      items.push({
        key: 'deviceSize',
        onRender: () => {
          return (
            <Stack
              horizontal
              tokens={{ childrenGap: 4 }}
              verticalAlign="center"
              style={{ marginLeft: 18 }}
            >
              <IconButton
                iconProps={{ iconName: 'TVMonitor' }}
                title={i18next.t("editor.desktop")}
                ariaLabel="Desktop"
                checked={!device || device === 'desktop'}
                onClick={() => {
                  onDeviceChange('desktop');
                }}
              />
              <IconButton
                iconProps={{ iconName: 'Tablet' }}
                title={i18next.t("editor.tablet")}
                ariaLabel="Tablet"
                checked={device === 'tablet'}
                onClick={() => {
                  onDeviceChange('tablet');
                }}
              />
              <IconButton
                iconProps={{ iconName: 'CellPhone' }}
                title={i18next.t("editor.mobile")}
                ariaLabel="Mobile"
                checked={device === 'mobile'}
                onClick={() => {
                  onDeviceChange('mobile');
                }}
              />
            </Stack>
          );
        },
      });
    }

    return items;
  }, [getPost?.result, device, loading, editor, location]);

  const farToolbarItems = useMemo<ICommandBarItemProps[]>(() => {
    if (loading) {
      return [
        {
          key: 'loader',
          onRender: () => {
            return (
              <Stack
                horizontal
                tokens={{ childrenGap: 12 }}
                verticalAlign="center"
                style={{ height: '100%' }}
              >
                <Shimmer
                  width={100}
                  shimmerElements={[
                    { type: ShimmerElementType.line, height: 8 },
                  ]}
                  style={{}}
                />
                <Shimmer
                  width={100}
                  shimmerElements={[
                    { type: ShimmerElementType.line, height: 8 },
                  ]}
                  style={{}}
                />
              </Stack>
            );
          },
        },
      ];
    }

    if (post?.versionId) {
      return [
        {
          key: 'history',
          text: getVersionsCount?.result
            ? `${i18next.t('command.history')} (${
                getVersionsCount?.result?.count
              })`
            : i18next.t('command.history'),
          iconProps: { iconName: 'History' },
          'data-cy': 'editor-commandBar-history',
          onClick: () => {
            setStateData('versionsOpen', true);
          },
        },
        {
          key: 'restore',
          text: i18next.t('command.restore'),
          'data-cy': 'editor-commandBar-restore',
          iconProps: { iconName: 'Edit' },
          onClick: () => {
            setStateData('versionRestoreOpen', true);
          },
        },
        {
          key: 'delete',
          text: i18next.t('command.delete'),
          'data-cy': 'editor-commandBar-delete',
          iconProps: { iconName: 'Delete' },
          onClick: () => {
            setStateData('versionsDeleteOpen', true);
          },
        },
        {
          key: 'cancel',
          text: i18next.t('command.cancel'),
          'data-cy': 'editor-commandBar-cancel',
          iconProps: { iconName: 'Cancel' },
          onClick: () => {
            history.push({
              search: queryString.stringify({
                ...(queryString.parse(location.search) || {}),
                versionId: undefined,
                action: undefined,
              }),
            });
          },
        },
      ];
    }
    const items = filterPermissions([
      {
        key: 'copyUrl',
        text: i18next.t('command.copyApiUrl'),
        iconProps: { iconName: 'ClipboardList' },
        onClick: () => {
          copyToClipboard(
            `${window.location.origin}/api/content/${post.slugPath}`
          );
          snackbar.openSnackbar({
            message: i18next.t('message.copyApiUrlSuccess'),
            messageBarType: MessageBarType.success,
            duration: 3000,
          });
        },
      },
      {
        key: 'history',
        text: getVersionsCount?.result
          ? `${i18next.t('command.history')} (${
              getVersionsCount?.result?.count
            })`
          : i18next.t('command.history'),
        'data-cy': 'editor-commandBar-history',
        disabled: apiLoading,
        iconProps: { iconName: 'History' },
        onClick: () => {
          setStateData('versionsOpen', true);
        },
      },
      {
        key: 'contentType',
        text: i18next.t('command.editContentType'),
        'data-cy': 'editor-commandBar-editContentType',
        iconProps: { iconName: 'Edit' },
        disabled: apiLoading,
        permissions: ['content_types_update'],
        onClick: () => {
          setStateData('updateContentTypeOpen', true);
        },
      },
      {
        key: 'settings',
        text: i18next.t('command.settings'),
        'data-cy': 'editor-commandBar-settings',
        iconProps: { iconName: 'Settings' },
        disabled: apiLoading,
        onClick: () => {
          setStateData('updatePostOpen', true);
        },
      },
      {
        key: 'publish',
        text: i18next.t('command.publish'),
        'data-cy': 'editor-commandBar-publish',
        iconProps: { iconName: 'WebPublish' },
        disabled: apiLoading,
        onClick: () => {
          setStateData('publishPostOpen', true);
        },
      },
      {
        key: 'save',
        'data-cy': 'editor-commandBar-save',
        iconProps: { iconName: 'Save' },
        disabled: apiLoading,
        text: i18next.t('command.save'),
        onClick: () => {
          handleSubmit();
        },
      },
    ]);
    if (post?.publishedAt) {
      items.splice(2, 0, {
        key: 'unpublish',
        text: i18next.t('command.unpublish'),
        'data-cy': 'editor-commandBar-unpublish',
        iconProps: { iconName: 'UnpublishContent' },
        disabled: apiLoading,
        onClick: () => {
          setStateData('unpublishPostOpen', true);
        },
      });
    }
    if (enableEditor && editor === 'preview') {
      items.push({
        key: 'toggle',
        'data-cy': 'editor-commandBar-toggle-menu',
        iconProps: { iconName: 'SidePanelMirrored' },
        checked: menuOpened,
        onClick: () => {
          toggleMenu(!menuOpened);
        },
      },)
    }
    return items;
  }, [getPost?.result, apiLoading, post, editor, loading, stateData, getVersionsCount?.result, menuOpened]);

  return (
    <CommandBar
      items={commandItems}
      style={{ borderBottom: `1px solid ${NeutralColors.gray30}` }}
      farItems={farToolbarItems}
    />
  );
};

export default EditorCommandBar;
