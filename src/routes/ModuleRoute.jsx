import { useSelector } from 'react-redux';
import { Link, Outlet } from 'react-router-dom';
import { selectCurrentUser } from '../features/auth/authSlice';
import PageHeader from '../components/PageHeader';
import { EmptyState } from '../components/StateMessage';
import { useTranslation } from '../i18n';
import { can, hasModule } from '../utils/roles';

// Shows the pages of a module only while the module exists and the user may view it.
export default function ModuleRoute({ module, permission }) {
  const user = useSelector(selectCurrentUser);
  const { t } = useTranslation();
  const moduleExists = hasModule(user, module);
  if (moduleExists && (!permission || can(user, permission))) return <Outlet />;

  return (
    <>
      <PageHeader title={t(moduleExists ? 'errors.permissionTitle' : 'errors.moduleTitle')} />
      <EmptyState
        title={t(moduleExists ? 'errors.permissionMessage' : 'errors.moduleMessage')}
        message={t(moduleExists ? 'errors.permissionHelp' : 'errors.moduleHelp')}
        action={<Link to="/dashboard">{t('errors.toDashboard')}</Link>}
      />
    </>
  );
}
