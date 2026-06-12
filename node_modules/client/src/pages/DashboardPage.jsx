import { useAuth } from "../contexts/AuthContext";
import GreetingHeader from "../components/dashboard/GreetingHeader";
import RoleRenderer from "../components/dashboard/RoleRenderer";
// import WhoamI from "../components/debug/WhoamI"

const DashboardPage = () => {
  const user = useAuth();

  return (
    <div className="space-y-6">
      <GreetingHeader user={user} />

      {/* Debug */}
      {/* <WhoAmI /> */}
      <RoleRenderer rol={user?.rol} />
    </div>
  );
};

export default DashboardPage;
