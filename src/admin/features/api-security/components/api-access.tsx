import { Stack, PrimaryButton } from '@fluentui/react';
import React, { useEffect, useMemo, useState } from 'react';
import { ControlledDropdown } from '@admin/components/rhf-components';
import { useForm } from 'react-hook-form';
import { findSettingsValue, isTrue } from '@admin/helpers/utility';
import { useSettings } from '@admin/context/settings';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';

const ApiAccessSettings = () => {
  const { updateSettings, settingsArray } = useSettings();
  const { t } = useTranslation();

  const defaultValues = useMemo(() => {
    const apiAccess = findSettingsValue(settingsArray, 'apiAccess');
    return {
      apiAccess: apiAccess || 'public',
    };
  }, [JSON.stringify(settingsArray)]);

  const { control, watch, handleSubmit } = useForm({
    defaultValues,
  });

  const [values, setValues] = useState<any>(defaultValues);

  useEffect(() => {
    watch((val: any) => {
      setValues(val);
    });
  }, []);

  return (
    <Stack tokens={{ childrenGap: 8, maxWidth: 600 }}>
      <ControlledDropdown
        control={control}
        name="apiAccess"
        options={[
          {
            key: 'public',
            text: t('api.public'),
          },
          {
            key: 'private',
            text: t('api.private'),
          },
        ]}
      />
      <Stack horizontal horizontalAlign={'end'}>
        <PrimaryButton
          disabled={_.isEqual(values, defaultValues)}
          onClick={() => {
            handleSubmit((val) => {
              updateSettings.execute('apiAccess', val?.apiAccess);
            })();
          }}
        >
          {t('command.update')}
        </PrimaryButton>
      </Stack>
    </Stack>
  );
};

export default ApiAccessSettings;
