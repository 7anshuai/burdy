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
import {useForm} from 'react-hook-form';
import {ControlledTextField} from '@admin/components/rhf-components';
import {useAssets} from '../context/assets.context';
import { useTranslation } from 'react-i18next';

const AssetsRenameDialog = () => {
  const { t } = useTranslation();
  const {rename, selectedAssets, stateData, setStateData} = useAssets();

  const selectedAsset = useMemo(() => {
    return selectedAssets[0];
  }, [selectedAssets]);

  const {control, handleSubmit, reset} = useForm({});

  useEffect(() => {
    if (stateData?.renameAssetOpen) {
      reset({
        name: selectedAsset?.name,
      });
      rename.reset();
    }
  }, [stateData?.renameAssetOpen]);

  useEffect(() => {
    if (rename?.result) {
      setStateData('renameAssetOpen', false);
    }
  }, [rename?.result]);

  const submit = handleSubmit((data) => {
    rename.execute(selectedAsset?.id, data?.name);
  });

  return (
    <Dialog
      hidden={!stateData?.renameAssetOpen}
      onDismiss={() => setStateData('renameAssetOpen', false)}
      dialogContentProps={{
        type: DialogType.close,
        title: `${t('command.rename')}?`,
      }}
      modalProps={{
        styles: {main: {maxWidth: 450}},
      }}
    >
      <form onSubmit={submit}>
        {rename?.error && (
          <MessageBar
            messageBarType={MessageBarType.error}
            isMultiline={false}
            onDismiss={() => rename.reset()}
            dismissButtonAriaLabel="Close"
          >
            {t('message.name.isExist')}
          </MessageBar>
        )}
        <Stack tokens={{childrenGap: 10}}>
          <ControlledTextField
            name="name"
            data-cy="assets-rename-name"
            control={control}
            autoFocus
            autoComplete="off"
            rules={{
              required: t('message.name.isRequired') as string,
            }}
          />
        </Stack>
        <DialogFooter>
          <DefaultButton
            onClick={() => setStateData('renameAssetOpen', false)}
            text="Cancel"
          />
          <PrimaryButton
            type="submit"
            data-cy="assets-rename-submit"
            text={t("command.rename")}
            disabled={rename?.loading}
          />
        </DialogFooter>
      </form>
    </Dialog>
  );
};

export default AssetsRenameDialog;
