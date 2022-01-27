import React, { useCallback, useEffect, useMemo } from 'react';
import {
  CommandBar,
  DefaultButton,
  IColumn,
  ICommandBarItemProps,
  Panel,
  PanelType,
  PrimaryButton,
  SelectionMode,
  ShimmeredDetailsList,
  Stack,
} from '@fluentui/react';
import { composeWrappers } from '@admin/helpers/hoc';
import {
  PostsContextProvider,
  usePosts,
} from '@admin/features/posts/context/posts.context';
import { IPost } from '@shared/interfaces/model';
import { useHistory, useLocation } from 'react-router';
import PostVersionsRestoreDialog from './post-versions-restore-dialog';
import PostVersionsDeleteDialog from './post-versions-delete-dialog';
import queryString from 'query-string';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';

const PostVersionsCommandBar = () => {
  const { getPosts, selectedPosts, setStateData, stateData } = usePosts();

  const commandItems = useMemo<ICommandBarItemProps[]>(
    () => [
      {
        key: 'restore',
        text: i18next.t('command.restore'),
        disabled: selectedPosts?.length !== 1,
        iconProps: { iconName: 'Undo' },
        onClick: () => {
          setStateData('versionRestoreOpen', true);
        },
      },
      {
        key: 'delete',
        text: i18next.t('command.delete'),
        disabled: !(selectedPosts?.length > 0),
        iconProps: { iconName: 'Delete' },
        onClick: () => {
          setStateData('versionsDeleteOpen', true);
        },
      },
    ],
    [getPosts, getPosts, stateData]
  );

  return (
    <CommandBar
      items={commandItems}
      styles={{
        root: {
          padding: 0,
        },
      }}
    />
  );
};

interface PostVersionsSelectPanelProps {
  isOpen?: boolean;
  post?: IPost;
  selectionMode?: SelectionMode;
  error?: string;
  onDismiss?: () => void;
  onSelect?: (post?: IPost) => void;
  onUpdate?: () => void;
  onDelete?: () => void;
}

const PostVersionsSelectPanel: React.FC<PostVersionsSelectPanelProps> = ({
  isOpen,
  onDismiss,
  selectionMode,
  onSelect,
  onUpdate,
  onDelete,
  post,
}) => {
  const { getVersions, selectedPosts, selection, stateData, setStateData } =
    usePosts();

  const location = useLocation();
  const history = useHistory();
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen && post?.id) {
      getVersions.execute(post?.id);
    }
  }, [isOpen, post]);

  const Footer = useCallback(
    () => (
      <Stack horizontal tokens={{ childrenGap: 10 }}>
        <PrimaryButton
          disabled={selectedPosts?.length !== 1}
          onClick={() => {
            onSelect(selectedPosts?.[0]);
          }}
        >
          {t('command.open')}
        </PrimaryButton>
        <DefaultButton onClick={onDismiss}>{t('command.cancel')}</DefaultButton>
      </Stack>
    ),
    [isOpen, post, selectedPosts]
  );

  const columns = useMemo<IColumn[]>(
    () => [
      {
        key: 'author',
        name: i18next.t('common.author'),
        fieldName: 'author',
        minWidth: 50,
        maxWidth: 100,
        onRender: ({ author }) => (
          <span>
            {author?.firstName} {author?.lastName}
          </span>
        ),
        isPadded: true,
      },
      {
        key: 'createdAt',
        name: i18next.t('common.createdAt'),
        onRender: ({ createdAt }) => <div>{createdAt}</div>,
        minWidth: 50,
        data: 'string',
        isPadded: true,
      },
    ],
    []
  );

  return (
    <Panel
      isOpen={isOpen}
      headerText={t("command.selectVersion")}
      isFooterAtBottom
      onRenderFooterContent={Footer}
      onDismiss={onDismiss}
      type={PanelType.medium}
    >
      <PostVersionsCommandBar />
      <ShimmeredDetailsList
        setKey="items"
        items={getVersions?.result || []}
        columns={columns}
        selectionMode={selectionMode}
        selection={selection as any}
        enableShimmer={getVersions.loading}
        ariaLabelForShimmer="Versions are being fetched"
        ariaLabelForGrid="Item details"
      />
      <PostVersionsDeleteDialog
        isOpen={stateData?.versionsDeleteOpen}
        onDismiss={() => setStateData('versionsDeleteOpen', false)}
        onDeleted={(deleted) => {
          setStateData('versionsDeleteOpen', false);
          getVersions.execute(post?.id);
          onDelete();
          if ((deleted || []).indexOf(post?.versionId) > -1 && onUpdate) {
            history.push({
              search: queryString.stringify({
                ...(queryString.parse(location.search) || {}),
                versionId: undefined,
                action: 'version_deleted',
              }),
            });
            onDismiss();
          }
        }}
      />
      <PostVersionsRestoreDialog
        isOpen={stateData?.versionRestoreOpen}
        onDismiss={() => setStateData('versionRestoreOpen', false)}
        onRestored={() => {
          setStateData('versionRestoreOpen', false);
          history.push({
            search: queryString.stringify({
              ...(queryString.parse(location.search) || {}),
              action: 'version_restored',
            }),
          });
          if (onUpdate) {
            onUpdate();
          }
        }}
      />
    </Panel>
  );
};

export default composeWrappers({
  postsContext: PostsContextProvider,
})(PostVersionsSelectPanel);
