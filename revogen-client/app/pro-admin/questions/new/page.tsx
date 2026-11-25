import { redirect } from 'next/navigation';

// The MCQ editor moved into the super admin console.
export default function LegacyQuestionsRedirect() {
  redirect('/pro-admin/mcq');
}
