import React, { useMemo } from 'react';
import Heading from '@admin/components/heading';
import Hooks from '@shared/features/hooks';
import { useTranslation } from 'react-i18next';

const GeneralSettings = () => {
  const sections = useMemo<any[]>(() => {
    return Hooks.applySyncFilters('admin/settings/sections', []);
  }, []);
  const { t } = useTranslation();
  return (
    <div>
      <Heading title={t("settings.general.title")} noPadding>
        {!(sections?.length > 0) && t("settings.general.empty")}
      </Heading>
      {sections.map(({key, component}) => (
        <section key={key}>{component}</section>
      ))}
    </div>
  );
};

export default GeneralSettings;
