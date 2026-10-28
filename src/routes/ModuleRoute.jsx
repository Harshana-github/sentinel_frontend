import { useSelector } from 'react-redux';
import { Link, Outlet } from 'react-router-dom';
import { selectCurrentUser } from '../features/auth/authSlice';
import PageHeader from '../components/PageHeader';
import { EmptyState } from '../components/StateMessage';
import { useTranslation } from '../i18n';
import { hasModule } from '../utils/roles';

// Shows the pages of a module only while the module exists.
export default function ModuleRoute({ module }) {
  const user = useSelector(selectCurrentUser);
  const { t } = useTranslation();
  if (hasModule(user, module)) return <Outlet />;

  return (
    <>
      <PageHeader title={t('errors.moduleTitle')} />
      <EmptyState
        title={t('errors.moduleMessage')}
        message={t('errors.moduleHelp')}
        action={<Link to="/dashboard">{t('errors.toDashboard')}</Link>}
      />
    </>
  );
}
