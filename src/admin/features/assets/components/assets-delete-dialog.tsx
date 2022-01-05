import {
  DefaultButton,
  Dialog,
  DialogFooter,
  DialogType,
  PrimaryButton,
} from '@fluentui/react';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAssets } from '../context/assets.context';

const AssetsDeleteDialog = () => {
  const { t } = useTranslation();
  const { del, selectedAssets, stateData, setStateData } = useAssets();

  useEffect(() => {
    del.reset();
  }, [stateData?.deleteAssetsOpen]);

  useEffect(() => {
    if (del?.result) {
      setStateData('deleteAssetsOpen', false);
    }
  }, [del?.result]);

  return (
    <Dialog
      hidden={!stateData?.deleteAssetsOpen}
      onDismiss={() => setStateData('deleteAssetsOpen', false)}
      dialogContentProps={{
        type: DialogType.close,
        title: `${t('command.delete')}?`,
      }}
      modalProps={{
        styles: { main: { maxWidth: 450 } },
      }}
    >
      {t('assets.confirmDelete')}
      <DialogFooter>
        <DefaultButton
          onClick={() => setStateData('deleteAssetsOpen', false)}
          text={t("command.cancel")}
        />
        <PrimaryButton
          onClick={() => {
            del.execute(selectedAssets.map((asset) => asset.id));
          }}
          text={t("command.delete")}
          data-cy="assets-deleteConfirm"
          disabled={del?.loading}
        />
      </DialogFooter>
    </Dialog>
  );
};

export default AssetsDeleteDialog;
