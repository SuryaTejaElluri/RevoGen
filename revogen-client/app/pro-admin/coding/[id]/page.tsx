'use client';

import { useParams } from 'next/navigation';
import CodingEditor from '@/components/super-admin/CodingEditor';

export default function EditCodingQuestionPage() {
  const { id } = useParams<{ id: string }>();
  return <CodingEditor key={id} id={id} />;
}
