import React from 'react';
import Heading from '@admin/components/heading';
import PreviewEditorSettings from '@admin/features/settings/components/preview-editor-settings';
import { useTranslation } from 'react-i18next';

const PreviewEditorTab = () => {
  const { t } = useTranslation();
  return (
    <div>
      <Heading title={t("settings.previewEditor.title")} noPadding>
        {t("settings.previewEditor.desc")}
      </Heading>
      <PreviewEditorSettings />
    </div>
  );
};

export default PreviewEditorTab;
