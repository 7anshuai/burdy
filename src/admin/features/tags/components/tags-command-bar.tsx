import {
  CommandBar,
  ICommandBarItemProps,
  NeutralColors,
  SearchBox,
} from '@fluentui/react';
import React, { useMemo } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { useTags } from '../context/tags.context';
import { useAuth } from '@admin/features/authentication/context/auth.context';
import { useTranslation } from 'react-i18next';

interface ITagsCommandBarProps {}
const TagsCommandBar: React.FC<ITagsCommandBarProps> = () => {
  const { t } = useTranslation();
  const {
    selectedTags,
    getTags,
    params,
    setParams,

    stateData,
    setStateData,
  } = useTags();
  const { filterPermissions } = useAuth();
  const debounced = useDebouncedCallback(async (val) => {
    setParams({
      search: val,
    });
    getTags.execute({
      search: val,
    });
  }, 500);

  const commandItems = useMemo<ICommandBarItemProps[]>(
    () =>
      filterPermissions([
        {
          key: 'newItem',
          text: t('command.new'),
          'data-cy': 'tags-commandBar-new',
          iconProps: { iconName: 'Add' },
          permissions: ['tags_create'],
          onClick: () => {
            setStateData('createTagOpen', true);
          },
        },
        {
          key: 'update',
          text: t('command.update'),
          'data-cy': 'tags-commandBar-update',
          disabled: selectedTags?.length !== 1,
          iconProps: { iconName: 'Edit' },
          permissions: ['tags_update'],
          onClick: () => {
            setStateData('updateTagOpen', true);
          },
        },
        {
          key: 'delete',
          text: t('command.delete'),
          'data-cy': 'tags-commandBar-delete',
          disabled: selectedTags?.length === 0,
          iconProps: { iconName: 'Delete' },
          permissions: ['tags_delete'],
          onClick: () => {
            setStateData('deleteTagsOpen', true);
          },
        },
        {
          key: 'refresh',
          text: t('command.refresh'),
          'data-cy': 'tags-commandBar-refresh',
          iconProps: { iconName: 'Refresh' },
          onClick: () => {
            getTags.execute(params);
          },
        },
      ]),
    [selectedTags, params, stateData]
  );

  const farToolbarItems = useMemo<ICommandBarItemProps[]>(
    () => [
      {
        key: 'search',
        onRenderIcon: () => (
          <SearchBox
            placeholder={t("tags.searchTags")}
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
      style={{ borderBottom: `1px solid ${NeutralColors.gray30}` }}
      farItems={farToolbarItems}
    />
  );
};

export default TagsCommandBar;
