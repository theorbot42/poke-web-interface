import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useSocket } from '@/hooks/useSocket';

export default function Layout() {
  useSocket();

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
