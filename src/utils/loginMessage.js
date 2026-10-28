// Ready-to-send message with a person's login details, in the UI language (`t` from useTranslation).
export function buildLoginMessage(organization, account, t) {
  const lines = [
    t('loginMessage.greeting', { name: account.name }),
    '',
    t('loginMessage.ready', { organization: organization.name }),
    '',
    t('loginMessage.url', { url: `${window.location.origin}/login` }),
    t('loginMessage.email', { email: account.email }),
  ];
  if (account.password) lines.push(t('loginMessage.password', { password: account.password }));
  return lines.join('\n');
}
