import { useSelector } from 'react-redux';
import { Link, Outlet } from 'react-router-dom';
import { selectCurrentUser } from '../features/auth/authSlice';
import PageHeader from '../components/PageHeader';
import { EmptyState } from '../components/StateMessage';
import { hasModule } from '../utils/roles';

// Shows the pages of a module only while the module exists.
export default function ModuleRoute({ module }) {
  const user = useSelector(selectCurrentUser);
  if (hasModule(user, module)) return <Outlet />;

  return (
    <>
      <PageHeader title="Module not available" />
      <EmptyState
        title="This module is not available."
        message="It may have been removed. Contact the Sentinel team if you need access."
        action={<Link to="/dashboard">Go to the dashboard</Link>}
      />
    </>
  );
}
