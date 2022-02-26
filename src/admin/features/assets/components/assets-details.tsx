import {
  CommandBar,
  DefaultButton,
  ICommandBarItemProps,
  IStackItemStyles,
  makeStyles,
  MessageBar,
  MessageBarType,
  Panel,
  PanelType,
  PrimaryButton,
  Stack,
  Text,
} from '@fluentui/react';
import React, { useCallback, useEffect, useMemo } from 'react';
import {
  copyToClipboard,
  getMeta,
  humanFileSize,
} from '@admin/helpers/utility';
import { ControlledTextField } from '@admin/components/rhf-components';
import { useForm } from 'react-hook-form';
import TagsPickerControl from '@admin/features/tags/components/tags-picker-control';
import {
  FOLDER_MIME_TYPE,
  IMAGE_MIME_TYPES,
  useAssets,
} from '../context/assets.context';
import {useSnackbar} from "@admin/context/snackbar";
import {formatDate} from "@admin/helpers/misc";
import { useTranslation } from 'react-i18next';

const stackItemStyles: IStackItemStyles = {
  root: {
    padding: '1rem 0',
  },
};

const useStyles = makeStyles((theme) => ({
  wrapper: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    columnGap: '2rem',
  },
  heading: {
    paddingTop: '2rem',
    fontWeight: '600',
  },
  itemHeading: {
    fontWeight: '600',
  },
  previewImage: {
    maxHeight: 256,
    maxWidth: '100%',
    marginRight: 'auto',
    border: `1px solid ${theme.palette.neutralLight}`
  }
}));

const AssetsDetails = () => {
  const styles = useStyles();
  const { t } = useTranslation();
  const { update, selectedAssets, stateData, setStateData, assetSrc } = useAssets();
  const {openSnackbar} = useSnackbar();

  const selectedAsset = useMemo(() => {
    return selectedAssets[0];
  }, [selectedAssets]);

  const { control, reset, handleSubmit } = useForm();

  useEffect(() => {
    if (stateData?.assetDetailsOpen) {
      update.reset();
      reset({
        alt: getMeta(selectedAsset, 'alt')?.value,
        copyright: getMeta(selectedAsset, 'copyright')?.value,
        tags: selectedAsset?.tags,
      });
    }
  }, [stateData?.assetDetailsOpen]);

  const isImage = useMemo(() => {
    return IMAGE_MIME_TYPES.indexOf(selectedAsset?.mimeType) > -1 || selectedAsset?.mimeType === 'image/svg+xml';
  }, [selectedAsset]);

  useEffect(() => {
    if (update?.result) {
      setStateData('assetDetailsOpen', false);
    }
  }, [update?.result]);

  const Footer = useCallback(
    () => (
      <Stack horizontal tokens={{ childrenGap: 10 }}>
        <PrimaryButton
          type="submit"
          disabled={update.loading}
          onClick={() => {
            handleSubmit((data) => {
              update.execute(selectedAsset?.id, data);
            })();
          }}
          data-cy="assets-details-submit"
        >
          {t('command.save')}
        </PrimaryButton>
        <DefaultButton onClick={() => setStateData('assetDetailsOpen', false)} data-cy="assets-details-close">
          {t('command.close')}
        </DefaultButton>
      </Stack>
    ),
    [selectedAsset, isImage, stateData]
  );

  const commandItems = useMemo<ICommandBarItemProps[]>(
    () => [
      {
        key: 'download',
        text: t('command.download'),
        disabled:
          selectedAssets?.length !== 1 ||
          (selectedAssets[0] &&
            selectedAssets[0].mimeType === FOLDER_MIME_TYPE),
        iconProps: { iconName: 'Download' },
        onClick: () =>
          window
            .open(
              `/api/assets/${selectedAssets[0].id}?attachment=true`,
              '_blank'
            )
            .focus(),
      },
      {
        key: 'copy',
        text: t('command.copyUrl'),
        disabled:
          selectedAssets?.length !== 1 ||
          (selectedAssets[0] &&
            selectedAssets[0].mimeType === FOLDER_MIME_TYPE),
        iconProps: { iconName: 'Copy' },
        onClick: () => {
          copyToClipboard(
            `${window.location.origin}/api/uploads/${selectedAssets[0]?.npath}`
          );
          openSnackbar({
            message: t('message.copyUrlSuccess'),
            messageBarType: MessageBarType.success,
            duration: 1000,
          });
        },
      },
    ],
    [selectedAssets]
  );

  return (
    <Panel
      isLightDismiss
      isOpen={stateData?.assetDetailsOpen}
      onDismiss={() => setStateData('assetDetailsOpen', false)}
      headerText={t("assets.viewAsset")}
      closeButtonAriaLabel="Close"
      type={PanelType.custom}
      customWidth={400 as any}
      onRenderFooterContent={Footer}
      isFooterAtBottom
    >
      <Stack
        tokens={{
          childrenGap: 10,
        }}
      >
        <Text className={styles.heading} variant="mediumPlus" block>
          {selectedAsset?.name}
        </Text>
        {isImage && (
          <img className={styles.previewImage} src={assetSrc(selectedAsset)} alt="Preview" />
        )}
        <CommandBar
          items={commandItems}
          styles={{
            root: {
              padding: 0,
            },
          }}
        />
        {update?.error && (
          <MessageBar
            messageBarType={MessageBarType.error}
            isMultiline={false}
            onDismiss={() => update.reset()}
            dismissButtonAriaLabel="Close"
          >
            {t('assets.name.isExist')}
          </MessageBar>
        )}
        <div className={styles.wrapper}>
          {selectedAsset?.mimeType !== FOLDER_MIME_TYPE && (
            <Stack styles={stackItemStyles}>
              <Text className={styles.itemHeading} variant="medium" block>
                {t('assets.fileSize')}
              </Text>
              <Text variant="medium" block>
                {humanFileSize(selectedAsset?.contentLength)}
              </Text>
            </Stack>
          )}
          <Stack styles={stackItemStyles}>
            <Text className={styles.itemHeading} variant="medium" block>
              {t('assets.mimeType')}
            </Text>
            <Text variant="medium" block data-cy="assets-details-mimeType">
              {selectedAsset?.mimeType}
            </Text>
          </Stack>
          <Stack styles={stackItemStyles}>
            <Text className={styles.itemHeading} variant="medium" block>
              {t('assets.dateCreated')}
            </Text>
            <Text variant="medium" block>
              {formatDate(selectedAsset?.createdAt)}
            </Text>
          </Stack>
        </div>

        <Stack tokens={{ childrenGap: 10, maxWidth: 330 }}>
          {isImage && (
            <>
              <ControlledTextField name="alt" label="Alt" control={control} />
              <ControlledTextField
                name="copyright"
                label={t("app.copyright")}
                control={control}
              />
            </>
          )}
          <TagsPickerControl name="tags" label={t("app.tags")} control={control} />
        </Stack>
      </Stack>
    </Panel>
  );
};

export default AssetsDetails;
