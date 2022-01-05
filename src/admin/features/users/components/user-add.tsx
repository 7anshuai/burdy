import React, { useCallback, useEffect, useState } from 'react';
import {
  DefaultButton,
  makeStyles,
  MessageBarType,
  Panel,
  PanelType,
  PersonaCoin,
  PersonaInitialsColor,
  PersonaSize,
  Pivot,
  PivotItem,
  PrimaryButton,
  Stack,
  Text,
} from '@fluentui/react';
import LoadingBar from '@admin/components/loading-bar';
import * as yup from 'yup';
import { useHistory } from 'react-router';
import { useUsers } from '@admin/features/users/context/users.context';
import generator from 'generate-password-browser';
import copy from 'copy-text-to-clipboard';
import { withGroupsContext } from '@admin/helpers/hoc';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  ControlledCheckbox,
  ControlledTextField,
} from '@admin/components/rhf-components';
import UserGroups from '@admin/features/users/components/user-groups';
import { IGroup } from '@shared/interfaces/model';
import { useSnackbar } from '@admin/context/snackbar';
import StatusBar from '@admin/components/status-bar';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';

const useStyles = makeStyles({
  content: {
    paddingTop: 24,
  },
  mainInformation: {
    marginTop: 36,
    marginBottom: 24,
  },
  personaCoin: {
    paddingRight: 20,
  },
});

const schema = yup.object({
  password: yup.string().min(6).required().label(i18next.t('user.password')),
  email: yup.string().email().required().label(i18next.t('user.email')),
  firstName: yup.string().label(i18next.t('user.firstName')),
  lastName: yup.string().label(i18next.t('user.lastName')),
});

const UserAdd = () => {
  const { t } = useTranslation();
  const styles = useStyles();
  const [groups, setGroups] = useState<IGroup[]>([]);
  const { create } = useUsers();
  const history = useHistory();
  const [open, setOpen] = useState(false);
  const { openSnackbar } = useSnackbar();
  const { control, handleSubmit, setValue, getValues, watch, register } =
    useForm({
      resolver: yupResolver(schema),
      defaultValues: {
        email: '',
        firstName: '',
        lastName: '',
        password: '',
        notify: true,
        groups: [],
      },
    });

  const [firstName, lastName, email] = watch([
    'firstName',
    'lastName',
    'email',
  ]);

  const close = useCallback(() => {
    history.push('/users/');
  }, []);

  useEffect(() => {
    register('groups');
    setOpen(true);
  }, []);

  useEffect(() => {
    setValue(
      'groups',
      groups.map((g) => g.id)
    );
  }, [groups]);

  const submit = handleSubmit(async (data) => {
    try {
      await create.execute(data as any);
      setOpen(false);
      openSnackbar({
        message: t('users.userCreated', { email: data.email }),
        messageBarType: MessageBarType.success,
      });
    } catch (e) {
      //
    }
  });

  const renderFooterContent = useCallback(
    () => (
      <Stack horizontal tokens={{ childrenGap: 10 }}>
        <PrimaryButton data-cy="users-add-submit" onClick={submit}>{t('command.create')}</PrimaryButton>
        <DefaultButton onClick={() => setOpen(false)}>{t('command.cancel')}</DefaultButton>
      </Stack>
    ),
    []
  );

  return (
    <Panel
      isOpen={open}
      headerText={t("users.profile")}
      isFooterAtBottom
      onRenderFooterContent={renderFooterContent}
      onDismiss={() => setOpen(false)}
      onDismissed={close}
      type={PanelType.medium}
    >
      <LoadingBar loading={false}>
        <form onSubmit={submit}>
          <Stack
            horizontal
            verticalAlign="center"
            className={styles.mainInformation}
          >
            <Stack.Item>
              <PersonaCoin
                text={`${firstName} ${lastName}`}
                initialsColor={PersonaInitialsColor.blue}
                size={PersonaSize.size100}
                className={styles.personaCoin}
              />
            </Stack.Item>
            <Stack.Item>
              <Stack>
                <Text variant="xxLarge">
                  <b>{`${firstName} ${lastName}`}</b>
                </Text>
                <Text variant="large">{email}</Text>
                <Text variant="small">
                  {groups.map((group) => group?.name).join(' • ')}
                </Text>
              </Stack>
            </Stack.Item>
          </Stack>
          <Pivot data-cy="users-add-tabs">
            <PivotItem className={styles.content} headerText={t("users.account")}>
              <Stack tokens={{ childrenGap: 24 }} style={{ width: '100%' }}>
                <StatusBar controller={create} />
                <Stack tokens={{ childrenGap: 12 }}>
                  <Stack horizontal tokens={{ childrenGap: 12 }}>
                    <Stack.Item grow={1}>
                      <ControlledTextField
                        control={control}
                        label={t("user.firstName")}
                        name="firstName"
                        autoComplete="off"
                        data-cy="users-add-firstName"
                      />
                    </Stack.Item>
                    <Stack.Item grow={1}>
                      <ControlledTextField
                        control={control}
                        label={t("user.lastName")}
                        name="lastName"
                        autoComplete="off"
                        data-cy="users-add-lastName"
                      />
                    </Stack.Item>
                  </Stack>
                  <ControlledTextField
                    control={control}
                    label={t("user.email")}
                    name="email"
                    autoComplete="off"
                    data-cy="users-add-email"
                  />
                  <Stack>
                    <ControlledTextField
                      control={control}
                      label={t("user.password")}
                      type="text"
                      name="password"
                      autoComplete="off"
                      data-cy="users-add-password"
                      styles={{
                        suffix: {
                          padding: 0,
                        },
                        fieldGroup: {
                          borderRight: 'none',
                        },
                      }}
                      onRenderSuffix={() => (
                        <Stack horizontal>
                          <PrimaryButton
                            iconProps={{ iconName: 'Refresh' }}
                            style={{ minWidth: 0, padding: '0 4px' }}
                            onClick={() => {
                              setValue(
                                'password',
                                generator.generate({
                                  length: 12,
                                  numbers: true,
                                })
                              );
                            }}
                          />
                          <DefaultButton
                            iconProps={{ iconName: 'Copy' }}
                            style={{ minWidth: 0, padding: '0 4px' }}
                            onClick={() => {
                              copy(getValues().password);
                            }}
                          />
                        </Stack>
                      )}
                    />
                  </Stack>
                  <ControlledCheckbox
                    control={control}
                    label={t("users.sendEmail")}
                    name="notify"
                    styles={{
                      root: {
                        marginTop: 12,
                      },
                    }}
                  />
                </Stack>
              </Stack>
            </PivotItem>
            <PivotItem headerText={t("settings.tabs.groups")} className={styles.content}>
              <UserGroups setGroups={setGroups} groups={groups} close={close} />
            </PivotItem>
          </Pivot>
        </form>
      </LoadingBar>
    </Panel>
  );
};

export default withGroupsContext(UserAdd);
