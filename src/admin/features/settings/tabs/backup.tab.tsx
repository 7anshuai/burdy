import React from 'react';
import Heading from '@admin/components/heading';
import { composeWrappers } from '@admin/helpers/hoc';
import { BackupContextProvider } from '@admin/features/backup/context/backup.context';
import BackupCommandBar from '@admin/features/backup/components/backup-command-bar';
import BackupList from '@admin/features/backup/components/backup-list';
import { useTranslation } from 'react-i18next';

const BackupSettings = () => {
  const { t } = useTranslation();
  return (
    <div>
      <Heading title={t("settings.tabs.backups")} noPadding>
        {t('settings.backups.desc')}
      </Heading>
      <BackupCommandBar />
      <BackupList />
    </div>
  );
};

export default composeWrappers({
  backupContext: BackupContextProvider,
})(BackupSettings);
