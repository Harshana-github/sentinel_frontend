import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { selectCurrentUser } from '../features/auth/authSlice';
import PageHeader from '../components/PageHeader';
import { EmptyState } from '../components/StateMessage';
import { useTranslation } from '../i18n';
import { homePathFor } from '../utils/roles';

export default function NotFoundPage() {
  const user = useSelector(selectCurrentUser);
  const { t } = useTranslation();
  return (
    <>
      <PageHeader title={t('errors.notFoundTitle')} />
      <EmptyState title={t('errors.notFoundMessage')} action={<Link to={homePathFor(user)}>{t('errors.toDashboard')}</Link>} />
    </>
  );
}
