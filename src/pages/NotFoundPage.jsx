import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { selectCurrentUser } from '../features/auth/authSlice';
import PageHeader from '../components/PageHeader';
import { EmptyState } from '../components/StateMessage';
import { homePathFor } from '../utils/roles';

export default function NotFoundPage() {
  const user = useSelector(selectCurrentUser);
  return (
    <>
      <PageHeader title="Page not found" />
      <EmptyState title="The page you are looking for does not exist." action={<Link to={homePathFor(user)}>Go to the dashboard</Link>} />
    </>
  );
}
