'use client';

import ProAdminNavbar from '@/components/ProAdminNavbar';

export default function ProAdminDashboard() {
  return (
    <>
      <ProAdminNavbar />

      <div
        style={{
          padding: '30px',
        }}
      >
        <h1>
          Super Admin Dashboard
        </h1>

        <hr />

        <br />

        <h3>
          Available Features
        </h3>

        <ul>
          <li>
            User Management
          </li>

          <li>
            Promote/Demote Admins
          </li>

          <li>
            Delete Users
          </li>

          <li>
            Question Bank Management
          </li>

          <li>
            Analytics
          </li>
        </ul>
      </div>
    </>
  );
}