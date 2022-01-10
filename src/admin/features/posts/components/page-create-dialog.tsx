import {
  ControlledDropdown,
  ControlledTextField,
} from '@admin/components/rhf-components';
import {
  ContentTypesContextProvider,
  useContentTypes,
} from '@admin/features/content-types/context/content-types.context';
import {
  PostsContextProvider,
  usePosts,
} from '@admin/features/posts/context/posts.context';
import {composeWrappers} from '@admin/helpers/hoc';
import {
  DefaultButton,
  Dialog,
  DialogFooter,
  DialogType,
  MessageBar,
  MessageBarType,
  PrimaryButton,
  Stack,
} from '@fluentui/react';
import React, {useEffect, useMemo} from 'react';
import {Control, useForm} from 'react-hook-form';
import slugify from 'slugify';
import {slugRegex, slugRegexMessage} from '@shared/validators';
import { useTranslation } from 'react-i18next';

interface ISelectParentProps {
  control: Control;
}

const SelectParentImpl: React.FC<ISelectParentProps> = ({control}) => {
  const { t } = useTranslation();
  const {getPosts} = usePosts();
  const pages = useMemo(() => {
    return [
      {
        key: null,
        text: `-- ${t('common.none')} --`,
      },
      ...(getPosts?.result || []).map((page) => ({
        key: page.id,
        text: `${page.name} (${page.slug})`,
      })),
    ];
  }, [getPosts?.result]);

  useEffect(() => {
    getPosts.execute({
      type: 'page,folder,fragment',
    });
  }, []);

  return (
    <ControlledDropdown
      disabled={getPosts?.loading}
      name="parentId"
      label={t("sites.parent")}
      placeHolder={t("sites.selectParent")}
      control={control}
      defaultValue={null}
      options={pages}
    />
  );
};

const SelectParent = composeWrappers({
  postsContext: PostsContextProvider,
})(SelectParentImpl);

interface IPageCreateDialogProps {
  isOpen?: boolean;
  defaultValues?: any;
  onDismiss?: () => void;
  onCreated?: (data?: any) => void;
}

const PageCreateDialog: React.FC<IPageCreateDialogProps> = ({
                                                              isOpen,
                                                              defaultValues,
                                                              onDismiss,
                                                              onCreated,
                                                            }) => {
  const {createPost} = usePosts();
  const {getContentTypes} = useContentTypes();
  const { t } = useTranslation();

  const {control, handleSubmit, reset, formState, watch, setValue} = useForm({
    mode: 'all',
  });

  useEffect(() => {
    if (!formState?.dirtyFields?.slug && watch('name')) {
      const parsed = slugify(watch('name'), {
        replacement: '-',
        remove: undefined,
        lower: true,
      });

      setValue('slug', parsed);
    }
  }, [watch('name')]);

  useEffect(() => {
    createPost.reset();
    reset(defaultValues);
    if (isOpen) {
      getContentTypes.execute({
        type: 'page',
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && createPost?.result) {
      onCreated(createPost?.result);
    }
  }, [createPost?.result]);

  const submit = handleSubmit((data) => {
    createPost.execute({
      ...data,
      type: 'page',
    });
  });

  return (
    <Dialog
      hidden={!isOpen}
      onDismiss={onDismiss}
      dialogContentProps={{
        type: DialogType.close,
        title: t('sites.createPage'),
      }}
      modalProps={{
        styles: {main: {maxWidth: 500}},
      }}
    >
      <form onSubmit={submit}>
        <Stack
          tokens={{
            childrenGap: 8,
          }}
        >
          {createPost.error?.message && (
            <MessageBar messageBarType={MessageBarType.error}>
              {createPost.error.message}
            </MessageBar>
          )}
          <ControlledTextField
            rules={{
              required: t('message.name.isRequired') as string,
            }}
            name="name"
            label={t("common.name")}
            control={control}
          />
          <ControlledTextField
            name="slug"
            label={t("common.slug")}
            control={control}
            rules={{
              required: t('common.slug.isRequired') as string,
              pattern: {
                value: slugRegex,
                message: slugRegexMessage,
              }
            }}
          />
          <ControlledDropdown
            disabled={getContentTypes?.loading}
            name="contentTypeId"
            label={t("sites.contentType")}
            control={control}
            rules={{
              required: t('message.contentType.isRequired') as string,
            }}
            placeHolder={t("sites.selectContentType")}
            options={(getContentTypes?.result ?? []).map((contentType) => ({
              key: contentType.id,
              text: contentType.name,
            }))}
          />
          <SelectParent control={control}/>
        </Stack>
        <DialogFooter>
          <DefaultButton onClick={onDismiss} text={t("command.cancel")}/>
          <PrimaryButton
            type="submit"
            text={t("command.create")}
            disabled={createPost?.loading || getContentTypes?.loading}
          />
        </DialogFooter>
      </form>
    </Dialog>
  );
};

export default composeWrappers({
  contentTypesContext: ContentTypesContextProvider,
})(PageCreateDialog);
