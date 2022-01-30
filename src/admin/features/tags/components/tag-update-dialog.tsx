import {ControlledTextField} from '@admin/components/rhf-components';
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
import React, {useEffect} from 'react';
import {useForm} from 'react-hook-form';
import {useTags} from '../context/tags.context';
import {slugRegex, slugRegexMessage} from '@shared/validators';
import { useTranslation } from 'react-i18next';

interface ITagUpdateDialogProps {
  isOpen?: boolean;
  onDismiss?: () => void;
  onUpdated?: (data?: any) => void;
}

const TagUpdateDialog: React.FC<ITagUpdateDialogProps> = ({
                                                            isOpen,
                                                            onDismiss,
                                                            onUpdated,
                                                          }) => {
  const {updateTag, selectedTags} = useTags();
  const { t } = useTranslation();

  const {control, handleSubmit, reset} = useForm({
    mode: 'all',
  });

  useEffect(() => {
    if (isOpen) {
      updateTag.reset();
      reset({
        slug: selectedTags?.[0]?.slug,
        name: selectedTags?.[0]?.name,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (updateTag?.result) {
      onUpdated(updateTag?.result);
    }
  }, [updateTag?.result]);

  const submit = handleSubmit((data) => {
    updateTag.execute(selectedTags?.[0]?.id, data);
  });

  return (
    <Dialog
      hidden={!isOpen}
      onDismiss={onDismiss}
      dialogContentProps={{
        type: DialogType.close,
        title: `${t('command.update')} ${selectedTags?.[0]?.name}`,
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
          {updateTag.error?.message && (
            <MessageBar messageBarType={MessageBarType.error}>
              {updateTag.error.message}
            </MessageBar>
          )}
          <ControlledTextField
            rules={{
              required: t('message.name.isRequired') as string,
            }}
            name="name"
            label={t("common.name")}
            control={control}
            data-cy="tags-update-name"
            autoFocus
          />
          <ControlledTextField
            name="slug"
            label={t("common.slug")}
            control={control}
            rules={{
              required: t('message.slug.isRequired') as string,
              pattern: {
                value: slugRegex,
                message: slugRegexMessage,
              }
            }}
            data-cy="tags-update-slug"
          />
        </Stack>
        <DialogFooter>
          <DefaultButton onClick={onDismiss} text={t("command.cancel")}/>
          <PrimaryButton
            type="submit"
            text={t("command.update")}
            disabled={updateTag?.loading}
            data-cy="tags-update-submit"
          />
        </DialogFooter>
      </form>
    </Dialog>
  );
};

export default TagUpdateDialog;
