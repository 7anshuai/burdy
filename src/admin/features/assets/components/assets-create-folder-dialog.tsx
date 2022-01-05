import { ControlledTextField } from '@admin/components/rhf-components';
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
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useAssets } from '../context/assets.context';

const AssetsCreateFolderDialog = () => {
  const { t } = useTranslation();
  const { stateData, setStateData, createFolder, params } = useAssets();

  const { control, reset, handleSubmit } = useForm({
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    if (stateData?.newFolderOpen) {
      reset();
      createFolder.reset();
    }
  }, [stateData?.newFolderOpen]);

  useEffect(() => {
    if (createFolder?.result) {
      setStateData('newFolderOpen', false);
    }
  }, [createFolder?.result]);

  const submit = handleSubmit((data) => {
    createFolder.execute({
      ...(data || {}),
      parentId: params?.parentId,
    });
  });

  return (
    <Dialog
      hidden={!stateData?.newFolderOpen}
      onDismiss={() => setStateData('newFolderOpen', false)}
      dialogContentProps={{
        type: DialogType.normal,
        title: t('assets.newFolder'),
      }}
      modalProps={{
        styles: { main: { maxWidth: 450 } },
      }}
    >
      {createFolder?.error && (
        <MessageBar
          messageBarType={MessageBarType.error}
          isMultiline={false}
          onDismiss={() => createFolder.reset()}
          dismissButtonAriaLabel="Close"
        >
          {t('assets.name.isExist')}
        </MessageBar>
      )}

      <form onSubmit={submit}>
        <Stack tokens={{ childrenGap: 10 }}>
          <ControlledTextField
            name="name"
            control={control}
            data-cy="assets-createFolder-name"
            rules={{
              required: t('assets.name.isRequired') as string,
            }}
            autoComplete="off"
          />
        </Stack>

        <DialogFooter>
          <DefaultButton
            onClick={() => setStateData('newFolderOpen', false)}
            text={t("command.cancel")}
          />
          <PrimaryButton
            data-cy="assets-createFolder-submit"
            type="submit"
            text={t("command.create")}
            disabled={createFolder?.loading}
          />
        </DialogFooter>
      </form>
    </Dialog>
  );
};

export default AssetsCreateFolderDialog;
